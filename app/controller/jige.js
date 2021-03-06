'use strict';
const BaseController = require("./BaseController");

const Drawer = require("../public/js/drawer.js");


const fs = require('fs');
const utils = require("../public/utils");
const Sequelize = require('sequelize');
const crypto = require("crypto");


class JigeController extends BaseController {
    async images() {
        const {ctx} = this;
        const {filename} = ctx.params;
        this.ctx.set("Content-Type", "image/png");
        const path = `${this.config.baseDir}/app/public/images/${filename}`;
        console.log(`调试:获取参数`, filename)
        let buffer = await utils.readImageToBuffer(path);
        console.log(`调试:`, buffer);
        this.ctx.body = buffer
    }

    //获取AccessToken
    async getAccessToken() {
        try {
            console.log(`调试:进来了`, this.ctx.request.query);
            let res = await this.ctx.service.mpconfig.checkToken();
            let {code} = this.ctx.request.query;
            let data = await this.ctx.service.jige.getAccessToken({code});
            data = utils.encode(JSON.stringify(data));
            this.ctx.body = {
                code: data.errcode || 0,
                data
            }
        } catch (e) {
            this.ctx.body = e
        }
    }

    //获取用户信息
    async getUserInfo() {
        await this.ctx.service.mpconfig.checkToken();
        // let {access_token, openid,code} = this.ctx.request.query;
        try {
            // let { access_token,openid }= await  this.ctx.service.jige.getAccessToken({code});

            let userInfo = await this.ctx.service.jige.getUserInfo();
            // console.log(`调试:获取到用户信息`,userInfo);
            this.ctx.body = {
                code: userInfo ? 0 : 4004,
                msg: userInfo ? '' : '用户未关注公众号',
                data: userInfo
            }
        } catch (e) {
            console.log(`调试:getUserInfo出错`, e);
            this.ctx.body = e
        }
    }


    //获取登录链接
    async getLoginUrl() {
        try {
            let {token} = await this.ctx.service.mpconfig.checkToken();
            const {appid} = this.ctx.mpconfig;
            let { env = "prod"} =this.ctx.request.query;
            // const redirect_uri = encodeURI(`https://lft.easy.echosite.cn/`);
            const redirect_uri = env!=="prod" ? encodeURI(`https://lft.easy.echosite.cn/`) : encodeURI(`http://jige.lianfangti.cn/`);
            const response_type = `code`;
            const scope = `snsapi_userinfo`;
            const state = token;

            let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}#wechat_redirect`
            this.ctx.body = {
                code: 0,
                data: {
                    url
                }
            }
        } catch (e) {
            console.error(`错误:登录失败`, e);
            this.ctx.body = e
        }
    }

    async getMpConfig(){

        try {
            let {token} = await this.ctx.service.mpconfig.checkToken();
            console.log(`调试:Token校验成功`, token);
            let config =await this.ctx.service.mpconfig.getAllConfig();
            console.log(`调试:获取全部配置`, config);
            config = config.dataValues;
            config = (({sign_coin,ex_coin,add_coin})=>({sign_coin,ex_coin,add_coin}))(config);
            this.ctx.body={
                code:0,
                data:{
                    ...config
                }
            }

        } catch (e) {
            console.error(`错误:获取配置信息失败`, e);
            this.ctx.body = e
        }
    }

    //获取充值套餐
    async getRechargeList() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            let pidsql = `pid = (SELECT recharge_plan FROM  mpconfig WHERE id = ${this.ctx.mpconfig.id})`;
            let items = await this.ctx.model.RechargePlan.findAll({
                attributes: ["name", "id", "price", "pay_price", "coin", "pid","bg","color"],
                where: Sequelize.literal(pidsql)
            });
            let {recharge_msg} = await this.service.mpconfig.getAllConfig();
            const data = {
                recharge_msg: recharge_msg || '',
                token: this.ctx.mpconfig.token,
                items: items
            };
            this.ctx.body = {
                code: 0,
                data
            }
            // await this.ctx.render("recharge.html", data)
        } catch (e) {
            this.ctx.logger.error(new Error(e));
            this.ctx.body = e
        }


    }
    //获取饿了么大礼包
    async getElemeBigGiftPackage(){
       this.ctx.body = await this.ctx.service.jige.getElemeBigGiftPackage();
    }

    async getLogDetaile(){
        this.ctx.body = await  this.ctx.service.jige.getLogDetaile();
    }

    //推广记录s
    async getExtensionUser() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            let {id, page, size, type} = this.ctx.request.query;
            size = size * 1;
            const typeMap = {
                week: `YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ) = YEARWEEK( now() ) `,
                month: `DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
                all: `true `
            };
            let count = await this.ctx.model.User.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'total']],
                where: {
                    father: id,
                    $and: Sequelize.literal(typeMap[type])

                }

            });
            let list = await this.ctx.model.User.findAll({
                attributes: {exclude: []},
                where: {
                    father: id
                },
                offset: (page - 1) * size,
                order: [['created_at', 'DESC']],
                limit: size

            });
            this.ctx.body = {
                code: 0,
                data: {
                    total: count[0].get("total"),
                    list
                }

            }
        } catch (e) {
            console.error(`错误:`, e);
            this.ctx.body = e
        }
    }

    //支付生单
    async pay() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            const md5 = crypto.createHash('md5');
            const url = `https://xorpay.com/api/cashier/4472`;
            const apps = 'fccd1864af5b43c99784d36855aa9f3d';
            const rules = {
                uid: [{required: true}],
                repid: [{required: true}],
                openid: [{required: true}],

            };
            let body = await this.validate({rules, type: "POST"});
            let recahrgePlanDetaile = await this.ctx.model.RechargePlan.findOne({
                attributes: {exclude: []},
                where: {id: body.repid}
            });
            let {pay_price, coin} = recahrgePlanDetaile;
            console.log(`调试:获取充值信息详情`, recahrgePlanDetaile);
            let data = {
                name: `鸡哥小助手充值${coin}粮票`,
                pay_type: 'jsapi',
                price: pay_price,
                order_id: `CZ${body.uid}${new Date().getTime()}`,
                order_uid: body.uid,
                notify_url: `http://eleme.lianfangti.cn/pay_callback?token=${this.ctx.mpconfig.token}`,
                cancel_url: `http://jige.lianfangti.cn/pages/recharge/recharge`,
                return_url: 'http://jige.lianfangti.cn',
                more: recahrgePlanDetaile.name,
                expire: 1300,
            };
            let {order_id, price, more, name} = data;
            // let order
            // console.log(`调试:摘取的订单 信息`, order);
            let orders = await this.ctx.service.orders.add({
                ...{order_id, price, more, name},
                coin,
                status: 0,
                buyer: data.order_uid

            });

            let str = `${data.name}${data.pay_type}${data.price}${data.order_id}${data.notify_url}${apps}`;
            console.log(`调试:拼接的字符串`, str);
            data['sign'] = md5.update(str).digest('hex').toUpperCase();
            // this.ctx.body= data
            console.log(`调试:最终发送的数据`, data);
            this.ctx.body = {
                code: 0,
                data: `${url}${utils.encodeParams(data)}`
            }
        } catch (e) {
            console.log(`调试:出错`, e);
            this.ctx.body = e
        }

    }

    //充值记录
    async getRechargeRecord() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            let {id, page, size} = this.ctx.request.query;
            size = size * 1;
            let count = await this.ctx.model.Recharge.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'total']],
                where: {
                    buyer: id,
                    status: 1
                }

            });
            let list = await this.ctx.model.Recharge.findAll({
                attributes: {exclude: []},
                where: {
                    buyer: id,
                    status: 1

                },
                offset: (page - 1) * size,
                order: [['created_at', 'DESC']],
                limit: size

            });
            this.ctx.body = {
                code: 0,
                data: {
                    total: count[0].get("total"),
                    list
                }

            }
        } catch (e) {
            console.error(`错误:`, e);
            this.ctx.body = e
        }
    }

    // 排行榜
    async getRankingList() {
        const typeMap = {
            week: `AND YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ,1) = YEARWEEK( now(),1 ) - 0`,
            month: `AND DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
            all: `AND true `
        };
        let type = this.ctx.request.query.type || 'all';
        let mode = this.ctx.request.query.mode || 'user';
        console.log(`调试:type的值`,type);
        const mysql = new Sequelize(this.config.sequelize);

        const sql = `SELECT id,nickname,ex_count ,headimgurl FROM users JOIN (SELECT father,COUNT(1) as ex_count FROM  users WHERE mid =2  ${typeMap[type]}  GROUP BY  father ) AS ex  
                    ON users.id = ex.father 
                    WHERE mid =2
                   
                    ORDER BY  ex.ex_count DESC 
                    LIMIT 0,100`;

        const sql2 =`SELECT
                    id,nickname,${type}_ex,headimgurl  FROM users  WHERE ${type}_ex >0
                                        `;
        let fakeuser = await  mysql.query(sql2,{type: mysql.QueryTypes.SELECT});
        console.log(`调试:查询出掺假用户数`, fakeuser);
        let data = await mysql.query(sql, {type: mysql.QueryTypes.SELECT});
        // let alldata= [...data,...fakeuser];

        let  ranking = await  this.ctx.model.Ranking.findAll({
            attributes:["name","id","gift"],
            where:{
                type
            }
        });
        let ex_count,user;
        if(mode==="user"){
            console.log(`调试：当前模式`, mode);
            user = await this.ctx.service.jige.checkXToken();
            // console.log(`调试:当前用户`, user);
            const typeMap2 = {
                week: `YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ) = YEARWEEK( now() ) `,
                month: `DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
                all: `true `
            };
            ex_count = await this.ctx.model.User.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'total']],
                where: {
                    father: user.id,
                    $and: Sequelize.literal(typeMap2[type])

                }

            });
            delete  user.mpconfig;

        }else{
            console.log(`调试:后台获取模式`);
            ex_count = 0;
             user = {}
        }


        for(let i in fakeuser){
            let flag = false,index;
            for(let j in data){
                if(fakeuser[i].id === data[j].id){
                    flag =true;
                    index = j;
                    break;
                }
            }
            if(flag){
                data[index]['ex_count']+= fakeuser[i][`${type}_ex`]
            }else{
                fakeuser[i]['ex_count']=fakeuser[i][`${type}_ex`];
                data.push(fakeuser[i])
            }

        }

        data.sort((item1,item2)=>{
            return item2["ex_count"] - item1["ex_count"];
        });
        this.ctx.body = {
            code:mode === 'user' ?0:20000,

            data:{
                list:data,
                fakeuser,
                ranking,
                ex_count:mode === 'user' ? (ex_count[0].get("total") + (user[`${type}_ex`] *  1)) : 0,
                fake_count:mode === 'user' ? user[`${type}_ex`]: 0,
                user:mode === 'user'? user: {},
            }
        }

    }


    // 排行榜2.0
    async getRankingList2() {

        const mysql = new Sequelize(this.config.sequelize);
        let type = this.ctx.request.query.type || 'week';  // 查询类型
        let mode = this.ctx.request.query.mode || 'user';  // 查询模式 用户端调用 和  管理后台调用
        let stage = this.ctx.request.query.stage || 'new';  // 是否带期查询
        let weekStart = utils.getWeekStartDate();  //获取本周周一
        let  curStageMap ={
            week: weekStart.Format("WyyMMdd"),
            month:new Date().Format("yyyyMM"),
            all:'all'
        };
        const typeMap = {
            week: `AND YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ,1) = YEARWEEK( now(),1 ) `,
            month: `AND DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
            all: `AND true `
        };
        let rewardMap ={
            week:[
                    {name:'第一名奖励',coin: 100 },
                    {name:'第二名奖励',coin: 90 },
                    {name:'第三名奖励',coin: 80 },
                    {name:'第四名奖励',coin: 70 },
                    {name:'第五名奖励',coin: 60 },
                    {name:'第六名奖励',coin: 50 },
                    {name:'第七名奖励',coin: 40 },
                    {name:'第八名奖励',coin: 30 },
                    {name:'第九名奖励',coin: 20 },
                    {name:'第十名奖励',coin: 10 }
                 ],
            month:[
                    {name:'月榜第一',coin: 0 },
                    {name:'月榜第二',coin: 0 },
                    {name:'月榜第三',coin: 0 },
                    {name:'月榜第四',coin: 0 },
                    {name:'月榜第五',coin: 0 },
                    {name:'月榜第六',coin: 0 },
                    {name:'月榜第七',coin: 0 },
                    {name:'月榜第八',coin: 0 },
                    {name:'月榜第九',coin: 0 },
                    {name:'月榜第十',coin: 0 }
                ],
            all:[]
         }
        let curStage = stage ==='new'? curStageMap[type]: stage;
        // console.log(`调试:`, curStage)

        try {
            let  existStage = await this.ctx.model.Stage.findOne({
                where:{name:curStage}
            });

            let currentStage = existStage? existStage : await  this.ctx.model.Stage.create({
                name:curStage,
                type,
                reward:JSON.stringify(rewardMap[type])
            });

            const sql = `SELECT id,nickname,ex_count ,headimgurl FROM users JOIN (SELECT father,COUNT(1) as ex_count FROM  users WHERE mid =2  ${typeMap[type]}  GROUP BY  father ) AS ex  
                    ON users.id = ex.father 
                    WHERE mid =2
                    ORDER BY  ex.ex_count DESC 
                    LIMIT 0,20`;
            let data = await mysql.query(sql, {type: mysql.QueryTypes.SELECT});
            console.log(`调试:查询出数据`, data);

            if(data.length){
                let  insertSql = `INSERT INTO  rank (uid,sid,value) VALUES`;
                let val = ``;
                for(let user of data){
                    val +=`(${user.id},${currentStage.id},'${user.ex_count}'),`
                }
                val=val.substring(0,val.length-1);
                console.log(`调试:val`, val);
                insertSql = `${insertSql} ${val} ON DUPLICATE KEY UPDATE value=VALUES(value)`;
                let insertResult = await  await mysql.query(insertSql, {type: mysql.QueryTypes.INSERT});

            }




            let  querySql= `SELECT sid,uid,nickname,value,headimgurl,status,fake FROM rank JOIN users ON rank.uid = users.id WHERE rank.sid=${currentStage.id} ORDER BY value + fake DESC`;

            let  rankingResult =  await mysql.query(querySql, {type: mysql.QueryTypes.SELECT});
            let reward;
            try {
                 reward = JSON.parse(currentStage.reward);
             }catch (e) {
                reward=[];
             }


            for(let i in reward ){
                if(!rankingResult[i]){
                    break;
                }
                rankingResult[i]['reward']=reward[i];

            }
            let results ={
                reward,
                data,
                currentStage,
                rank:rankingResult
            }
            let ex_count,user;
            if(mode==="user"){
                console.log(`调试：当前模式`, mode);
                user = await this.ctx.service.jige.checkXToken();
                // console.log(`调试:当前用户`, user);
                const typeMap2 = {
                    week: `YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ) = YEARWEEK( now() ) `,
                    month: `DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
                    all: `true `
                };
                ex_count = await this.ctx.model.User.findAll({
                    attributes: [[Sequelize.fn('COUNT', 1), 'total']],
                    where: {
                        father: user.id,
                        $and: Sequelize.literal(typeMap2[type])

                    }

                });
                delete  user.mpconfig;
                results = {...results,user,ex_count:ex_count[0].get('total')}
            }

            this.ctx.body = {
                code:mode==="user" ? 0 :20000,
                weekStart,
                data:results
            };

        }catch (e) {
            this.ctx.body = e;

            console.error(`错误:`, e)
        }



        return 0;






        console.log(`调试:查询出掺假用户数`, fakeuser);
        // let alldata= [...data,...fakeuser];

        let  ranking = await  this.ctx.model.Ranking.findAll({
            attributes:["name","id","gift"],
            where:{
                type
            }
        });
        let ex_count,user;
        if(mode==="user"){
            console.log(`调试：当前模式`, mode);
            user = await this.ctx.service.jige.checkXToken();
            // console.log(`调试:当前用户`, user);
            const typeMap2 = {
                week: `YEARWEEK( date_format(  created_at,'%Y-%m-%d' ) ) = YEARWEEK( now() ) `,
                month: `DATE_FORMAT( created_at, '%Y%m' ) = DATE_FORMAT( CURDATE( ) ,'%Y%m' ) `,
                all: `true `
            };
            ex_count = await this.ctx.model.User.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'total']],
                where: {
                    father: user.id,
                    $and: Sequelize.literal(typeMap2[type])

                }

            });
            delete  user.mpconfig;

        }else{
            console.log(`调试:后台获取模式`);
            ex_count = 0;
            user = {}
        }

        this.ctx.body = {
            code:mode === 'user' ?0:20000,

            data:{
                list:data,
                fakeuser,
                ranking,
                ex_count:mode === 'user' ? (ex_count[0].get("total") + (user[`${type}_ex`] *  1)) : 0,
                fake_count:mode === 'user' ? user[`${type}_ex`]: 0,
                user:mode === 'user'? user: {},
            }
        }

    }

    //检查签到
    async checkSignin() {
        try {
            this.ctx.body = await this.ctx.service.jige.checkSignin();
        } catch (e) {
            console.log(`调试:监听到错误`, e);
            this.ctx.body = e
        }
    }

    //签到
    async signin() {
        console.log(`调试:开始签到`);
        try {
            this.ctx.body = await this.ctx.service.jige.signin();
        } catch (e) {
            console.log(`调试:获取到错误`, e);
            this.ctx.body = e
        }
    }

    async drawExtensionCode() {
        console.log(`调试:`,);
        try {
            let user = await this.ctx.service.jige.checkXToken();
            let data = await this.ctx.service.jige.drawExtensionCode({id: user.id});
            this.ctx.set("Content-Type", "image/png");
            this.ctx.body = {
                data,
                code: 0
            };
        } catch (e) {
            console.error(`错误:绘制出错`, e)
            this.ctx.body = {
                code: 500,
                error: e
            }
        }
    }

    async  buildAvatarImage(){
        let {src} = this.ctx.request.query;
        console.log(`调试:获取到的头像`, src);
        let data= await  this.ctx.service.jige.buildAvatarImage({src});
        this.ctx.set("Content-Type", "image/png");
        this.ctx.body = data
    }
   async pullNmsl(){
       let urls={
           // "ktff":"https://nmsl.shadiao.app/api.php",
           "ktff":"http://www.nmsl8.club/index/nmsl/index.html",
           "sclh":"https://nmsl.shadiao.app/api.php?level=min",
           // "twqh":"https://chp.shadiao.app/api.php",
           "chp":"https://chp.shadiao.app/api.php",
       };
       let type =this.ctx.request.query.type || 'ktff';
       let text = await this.ctx.service.http.get({url: urls[type],headers:{
               "X-Requested-With":"XMLHttpRequest"
           }});
       if(text.list){
           text=text.list;
       }
       let nmsl =  await this.ctx.model.Nmsl.findOne({
           attributes:["id"],
           where:{
               word:text
           }
       });
       let result ;
       if(!nmsl){
           result =  await this.ctx.model.Nmsl.create({
               word:text,
               type
           })
       }else{
          result= "重复";
           console.log(`调试:已存在不插入`)
       }
       this.ctx.body ={
           code: result ==="重复"? 101:0,
           data:{
               text,
               status:result
           }
       }
   }

    async nmsl() {
        try {
            // let urls={
            //     "ktff":"https://nmsl.shadiao.app/api.php",
            //     "sclh":"https://nmsl.shadiao.app/api.php?level=min",
            //     "twqh":"https://chp.shadiao.app/?from_nmsl",
            //     "chp":"https://chp.shadiao.app/api.php",
            // };
            const mysql = new Sequelize(this.config.sequelize);
            let type =this.ctx.request.query.type || 'ktff';
            let sql = `select * from nmsl  WHERE type='${type}' order by rand() LIMIT 1;`;
            let nmsl = await  mysql.query(sql,{type: mysql.QueryTypes.SELECT});
            let text=  nmsl[0].word;
            console.log(`调试:获取到的随机数据`, text);

            // return  0;


            // let text = await this.ctx.service.http.get({url: urls[type]});
            // let nmsl =  await this.ctx.model.Nmsl.findOne({
            //     attributes:["id"],
            //     where:{
            //         word:text
            //     }
            // });
            // if(!nmsl){
            //     await this.ctx.model.Nmsl.create({
            //         word:text,
            //         type
            //     })
            // }else{
            //     console.log(`调试:已存在不插入`)
            // }

            let len = text.length; //字数
            let size = 9; //一行显示的字数
            let line = len % size === 0 ? ~~(len / size) : ~~(len / size) + 1; //行数计算
            let eles = []; // 文本元素数组
            let baseY=150;
            console.log(`调试:字数${len},行数${line}`, len / size);
            for (let i = 0; i < line; i++) {
                let str= text.substr(i*size,size);
                eles.push({
                    type:'text',
                    content: str,
                    size:20,
                    x:15,
                    y:baseY + (20*i)
                })
            }
            console.log(`调试:切割后的数组`, eles);
            let draw = new Drawer(200, 200 + (line -3)*20);
            // await draw.setBackgroundImage(`${this.config.baseDir}/app/public/images/mamalielie.png`);
            draw.setBackgroundColor("white");
            await draw.drawImage({image:`${this.config.baseDir}/app/public/images/mamalielie.png`,x:0,y:0,w:200,h:200});
           await draw.drawElements(eles);
            // draw.setBackgroundColor("red");
            // this.ctx.set("Content-Type", "image/png");
            // this.ctx.body = draw.getBuffer();
            // return 0;
            this.ctx.body = {
                code: 0,
                data: {
                    src: draw.getDataURL(),
                    text: text
                }
            }
        } catch (e) {
            console.error(`错误:`, e)
        }
    }

    async getMiaoMiaoToken(){
        let {oepnid } = this.ctx.request.query;
        let { url} =await  this.ctx.service.eleme.getHongbaoUrl({openid});
        console.log(`调试:获取到url`, url)

    }

}


module.exports = JigeController;





