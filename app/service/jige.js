const Service = require("egg").Service;
const cache = require('memory-cache');
const Sequelize = require('sequelize');
const {createCanvas, loadImage} = require('canvas');
const Drawer = require("../public/js/drawer.js");

const utils = require("../public/utils");

module.exports = class JigeService extends Service {
    async index() {
        return await this.ctx.model.Page.findAndCountAll({});
    }

    async getLogDetaile(){
        let {id}= this.ctx.params;
        let res =   await this.ctx.model.Log.findOne({
            where:{id}
        })
        if(res){
            res.sn = JSON.parse(res.sn);
            return  {
                code:0,
                data:res,
                msg:'success'
            }
        }else{
            this.ctx.status=404;
            return  {
                code:404,
                data:res,
                msg:'Not Found'
            }
        }
    }

    async getAccessToken({code}) {
        const {id} = this.ctx.mpconfig;
        let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.ctx.mpconfig.appid}&secret=${this.ctx.mpconfig.appsecret}&code=${code}&grant_type=authorization_code`;
        // let access_token = '';
        let access_token = await this.ctx.service.http.get({url});
        console.log(`调试:获取到的AccessToken`, access_token);
        return access_token
    }
    //大礼包接口
    async getElemeBigGiftPackage({openid}={}){
        let origin = this.ctx.headers["from"];
        let unitCoin = this.ctx.mpconfig.unit_coin;
        let context;
        if(origin === 'mp'){
            console.log(`调试:当前请求来源网页`);
           context = await  this.checkXToken();
        }else{
            console.log(`调试:当前请求来自公众号`,this.ctx.mpconfig);
            this.reply();
            context = await this.ctx.service.user.exist({
                where: {openid},
                col: ['phone', 'id', "times"],
                showCol: true
            });

        }
        console.log(`调试:商户红包单价`, unitCoin);
        console.log(`调试:用户余额`, context.times);
        // return ;

        // console.log(`调试:检查Token后获取到的信息`, context)



        if(!context.phone){
            return  Promise.reject({code:4002,message:'领取失败 用户未绑定手机号'});
        }

        if(context.times<unitCoin){
            return  Promise.reject({code:4001,message:'领取失败 余额不足'});
        }
        console.log(`调试:开始调用大礼包接口`, context.phone);


        // let getResult = await  this.ctx.service.http.post({
        //     url:`http://www.elmdhb.cn/dkhzy/getXJJDlb?token=ddB9XDAyzAPU9YWN&phone=${context.phone}`
        // });

        let getResult ={
            "msg": "领取成功",
            "code": "0000",
            "data": [
                {
                    "amount": 3.0,
                    "description": "满¥30.0可用",
                    "logo": "",
                    "title": "平台通用红包",
                    "type": 10,
                    "remarks": "2019-10-20到期"
                },
                {
                    "amount": 4.0,
                    "description": "满¥30.0可用",
                    "logo": "",
                    "title": "下午茶红包",
                    "type": 11,
                    "remarks": "2019-10-20到期"
                },
                {
                    "amount": 5.0,
                    "description": "满¥30.0可用",
                    "logo": "",
                    "title": "品质联盟专享红包",
                    "type": 2,
                    "remarks": "2019-10-20到期"
                },
                {
                    "amount": 6.0,
                    "description": "满¥39.0可用",
                    "logo": "",
                    "title": "夜宵红包",
                    "type": 12,
                    "remarks": "2019-10-20到期"
                }
            ],
            "success": true,
            "version": "1.0",
            "timestamp": 1571367765558
        }

        console.log(`调试:红包领取返回值`, getResult);
        let code  = getResult.code * 1;
        getResult.code=code;
        openid = openid || context.openid;
        if(!code){
            // let updateUserResult =  await ctx.service.user.update({times: user.times - ctx.mpconfig.unit_coin}, {openid});
            let updateUserResult =   await this.ctx.service.user.update({times: Sequelize.literal(`times - ${unitCoin}`)},{openid});//减去账户余额测试
            let updateMpResult =   await this.ctx.service.mpconfig.update({blance: Sequelize.literal(`blance - unit_price`)},{id:this.ctx.mpconfig.id});//减去账户余额测试

            let log = {
                type:'饿了么大礼包',
                sn:JSON.stringify(getResult.data),
                uid: context.id,
                phone:context.phone,
                times:  unitCoin,

            };
           let addLogResult =await  this.ctx.service.logs.add(log) ;//领红包日志表中插入数据
            let logId =addLogResult.get("id");

            let msg = `领取成功！！😄\n请在饿了么中查看\n红包类型:<a href="http://jige.lianfangti.cn?logid=${logId}">饿了么大礼包</a>\n粮票使用: -${unitCoin}\n剩余粮票:${context.times - unitCoin} \n绑定账号: ${context.phone} \n<a href="http://jige.lianfangti.cn?logid=${logId}">点击查看详情</a>`;

            this.ctx.service.weixin.sendServiceMessage({content: msg});
            return  Promise.resolve(getResult);


        }else{
            let msg = `领取失败！！😭\n ${getResult.msg}`;
            this.ctx.service.weixin.sendServiceMessage({content: msg});

            return  Promise.reject(getResult)
        }






    }

    async getUserInfo() {
        let tokens = await  this.checkXToken();
        let {access_token,openid,refresh_token} = tokens;
        console.log(`调试:tokens`, tokens);
        console.log(`调试:access_token`, access_token);
        const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}1&openid=${openid}&lang=zh_CN`;
        let wxInfo =   await  this.ctx.service.http.get({
          url
        });
        console.log(`调试:从微信服务器获取到用户信息`, wxInfo);
        if(wxInfo.errcode === 40001){
            let refresToken = await  this.refresToken({refresh_token})

        }
          console.log(`调试:`, wxInfo) ;
        let userInfo = await this.ctx.model.User.findOne({
            attributes: {exclude: []},
            where: {openid}
        });
        userInfo = userInfo.dataValues;
        let data = {...userInfo,...wxInfo};
        //是否领取过 加客服口令
        let added = await this.ctx.model.CodeCoinLog.findAll({
            attributes: ["id"],
            where: {
                cid: 14,
                uid: userInfo.id
            }
        })
        // userInfo.added = 111;
        // console.log(`调试:获取到系统里用户信息`, userInfo);
        return {...data, added: added.length ? true : false};

    }

    // token刷新
    async refresToken({refresh_token}) {
        // const  url =`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.ctx.mpconfig.appid}&secret=SECRET&code=CODE&grant_type=authorization_code`
        const url =`https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${this.ctx.mpconfig.appid}&grant_type=refresh_token&refresh_token=${refresh_token}`
        let res = await  this.ctx.service.http.get({
            url
        });
        if(res.access_token){
            return
        }else{
            console.error(`错误:刷新accessToken失败`, res)
            return  Promise.reject({error:res,message:"刷新accessToken失败",code:200});
        }

        console.log(`调试:refresh_token`, refresh_token);
        console.log(`调试:刷新token返回值`, res)
    }
    async checkTokens(){
        let tokens = this.ctx.headers["tokens"];
        if(!tokens){
            return Promise.reject({
                code: 403,
                msg: '无效tokens'
            })
        }else{
            tokens = utils.decode(tokens);
            tokens = JSON.parse(tokens);

            return  tokens
        }


    }
    async checkXToken({checkToken = false} = {}) {
        let xToken = this.ctx.headers["x-token"];
        if (!xToken) {
            console.log(`调试:没有XToken`, this.ctx.headers);
            return Promise.reject({
                code: 403,
                msg: '无效X-Token'
            })
        } else {
             try {
                 xToken = JSON.parse(utils.decode(xToken));
                 // console.log(`调试:获取到的解码后的XToken`, xToken);
                 let userInfo = await this.ctx.model.User.findOne({
                     attributes: ["id", "openid","times", "nickname","phone", "mid", "last_sign", "conn_sign", 'week_ex', 'month_ex', 'all_ex'],
                     where: {
                         openid: xToken.openid
                     }
                 });
                 if (!userInfo) {
                     return Promise.reject({
                         code: 403,
                         msg: '无效X-Token'
                     })
                 }
                 let mpconfig = await this.ctx.service.mpconfig.getAllConfig(userInfo.mid);
                 this.ctx.mpconfig = mpconfig;
                 let context = {...userInfo.dataValues,...xToken, mpconfig: {...mpconfig.dataValues}};
                 return context
             }catch (e) {
                   return  Promise.reject({message:'无效Token',error:e,code:403})
             }


        }




    }

    //检查签到
    async checkSignin() {
        let context = await this.checkXToken();
        // console.log(`调试:从XToken中获取的信息`, context)
        // console.log(`调试:最后签到时间`, context.dataValues.id);

        let now = new Date(); //当前时间
        let nowStr = `${now.getFullYear()}${now.getMonth()}${now.getDate()}`; //当前时间字符串
        let last_sign = new Date(context.last_sign); //最后签到时间
        let lastSignStr = `${last_sign.getFullYear()}${last_sign.getMonth()}${last_sign.getDate()}`; //最后签到时间字符串
        // console.log(`调试:今天是否签到lastSignStr[${lastSignStr}],nowStr[${nowStr}]`, lastSignStr == nowStr);
        // console.log(`调试:签到验证上下文`, context)
        return {
            code: 0,
            data: {
                signed: lastSignStr == nowStr,
                conn_sign: context.conn_sign,
                lastSignStr,
                nowStr
            }
        }
    }

    /**
     * 签到
     * @returns {Promise<Promise<Promise<never>|{msg, code, data}>|{msg: string, code: number, data: {addCoin: (*|number), conn_sign: *}}>}
     */
    async signin() {
        console.log(`调试:开始调用`)
        const user = await this.checkXToken();
        let {openid} = user;
        let now = new Date(); //当前时间
        let nowStr = `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
        let last_sign = new Date(user.last_sign); //最后签到时间
        let lastSignStr = `${last_sign.getFullYear()}${last_sign.getMonth()}${last_sign.getDate()}`;
        let maxInterval = 24 * 60 * 60; // 最大间隔秒数
        const config = user.mpconfig;
        // console.log(`调试:获取配置`, config);
        if (!config.sign) {
            return Promise.reject({
                code: 500,
                msg: '签到功能未开放'
            });

        }

        if (lastSignStr == nowStr) {
            console.log(`调试:今日已签到[${nowStr}][${lastSignStr}]`);
            return Promise.reject({
                code: 500,
                msg: '今日已签到'
            });
        }
        let addCoin = 0;
        let nd = new Date(new Date(new Date().toLocaleDateString()).getTime());
        let ld = new Date(new Date(last_sign.toLocaleDateString()).getTime());
        let nowInterval = (nd - ld) / 1000 //当前间隔时间

        console.log(`调试:判断是否连续签到 ]`, nowInterval, maxInterval, nowInterval <= maxInterval);
        if (nowInterval <= maxInterval && false) { // 是连续签到
            console.log(`调试:签到成功`);
            addCoin = config.sign_coin + (user.conn_sign + 1);
            // {coin,message,remark,type = 0,openid,giver}
            await this.ctx.service.user.giveCoin({
                coin: addCoin,
                message: '签到成功',
                remark: '每日签到',
                type: 2,
                openid,
                giver: 0
            });
            await this.ctx.model.User.update({
                last_sign: now,
                conn_sign: (user.conn_sign + 1) > 7 ? 0 : Sequelize.literal(`conn_sign + 1`)
            }, {where: {openid}});
            // await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n您已连续签到${(user.conn_sign + 1)}天\n`})
            return {
                code: 0,
                data: {
                    addCoin,
                    conn_sign: 0
                },
                msg: '签到成功'
            }
        } else { //不是连续签到
            console.log(`调试:不是连续签到`);
            addCoin = config.sign_coin;
            await this.ctx.model.User.update({
                last_sign: now,
                conn_sign: Sequelize.literal(`conn_sign + 1`)
            }, {where: {openid}});
            await this.ctx.service.user.giveCoin({
                coin: addCoin,
                message: '签到成功',
                remark: '每日签到',
                type: 2,
                openid,
                giver: 0
            });
            // await this.ctx.model.User.update({
            //   last_sign:now,
            //   conn_sign: 0
            // },{where:{openid}});
            return {
                code: 0,
                data: {
                    addCoin,
                    conn_sign: 0
                },
                msg: '签到成功'

            }
            // await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n连续签到可获取额外积分哦`})
        }

        // console.log(`调试:签到的用户信息[${user.id}]` ,nowStr,new Date(user.last_sign).getDate());

    }


    /**
     * 推广码绘制
     * @param id
     * @returns {Promise<void>}
     */
    async drawExtensionCode({id}) {
        let drawer = new Drawer(414, 736);
        // let image =;
        await drawer.setBackgroundImage(`${this.config.baseDir}/app/public/images/hongbao_v2.png`);
        // context.font = '23px Arial';
        let qrCodeBuffer = await this.ctx.service.weixin.qrcode({scene_id: id || 1, type: 'image'});
        // drawer.context.fillText("NM SL",150,150);
        await drawer.drawElements([
            {
                type: 'text',
                content: utils.encode(id),
                color: "white",
                x: -55,
                y: 16
            },
            {
                type: 'image',
                content: qrCodeBuffer,
                y: 513,
                w: 175
            }
        ])
        return drawer.getDataURL();

    }


    async buildAvatarImage({src =`${this.config.baseDir}/app/public/images/headimg.jpeg` }){
        let drawer = new Drawer(960, 960);
        // let loadImageRes =await  this.ctx.service.http.download({url:});
        // console.log(`调试:loadImageRes`, loadImageRes);
        // await drawer.setBackgroundImage(`${this.config.baseDir}/app/public/images/headimg.jpeg`);
        await drawer.drawElements([
            {
                type:'image',
                content:src,
                x:20,
                y:20,
                w:920,
                h:920
            },
            {
                type:'image',
                content:`${this.config.baseDir}/app/public/images/bg-avatar_build.png`,
                x:0,
                y:0,
                w:960,
                h:960
            }

        ]);
        return  drawer.getBuffer();



    }

    reply({type = 'text', content} = {}) {
        console.log(`\n\n 00000000000000000000000000000000[${new Date()}回复调用日志00000000000000000000000000000000\n]`);
        const {ctx} = this;
        const data = ctx.request.body;
        const head = `<xml><ToUserName><![CDATA[${data.FromUserName}]]></ToUserName> <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName> <CreateTime>${new Date().getTime()}</CreateTime> <MsgType><![CDATA[${type}]]></MsgType>`;
        let body;
        const end = `</xml>`;
        switch (type) {
            case 'text':
                body = `<Content><![CDATA[${content}]]></Content>`;
                break;
        }
        ctx.set("Content-Type", "text/xml");
        console.log(`调试:回复响应内容`, content ? `${head}${body}${end}` : 'success', "\n\n");
        ctx.body = content ? `${head}${body}${end}` : 'success'

    }


};
