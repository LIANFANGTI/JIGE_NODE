const {Service} = require("egg");
const Sequelize = require('sequelize');

module.exports = class UserService extends Service {
   //赠送金币
    async giveCoin({coin,message,remark,type = 0,openid,giver}){
        // 更新用户表
        await this.ctx.model.User.update(
            {times:Sequelize.literal(`times + ${coin}`)},
            { where:{ openid }});
        await this.ctx.model.GiveLog.create({
            coin,
            message,
            openid,
            remark,
            type,
            giver
        })
        return true;

    }


    // 领取口令红包
    async getCodeCoin({keyword,openid}){
        let coin =await this.ctx.model.CodeCoin.findOne({
            attributes:["coin","limit","log","id"],
            where:Sequelize.literal(`keyword =  '${keyword}'`)
        });
        let user = await  this.ctx.model.User.findOne({
            attributes:['id'],
            where:{openid}
        });
        // console.log(`调试:当前用户`, user)

        let getlog = await  this.ctx.model.CodeCoinLog.findOne({
            attributes:['id'],
            where:{
                uid:user.id,
                cid:coin.id
            }
        });
        console.log(`调试:剩余红包个数`,coin.limit - coin.log)
        if((coin.limit - coin.log)< 1){
            this.ctx.service.weixin.sendServiceMessage({content:' 啊哦~\n 你来晚一步 红包已经被抢光了😂'});
            return 0;
        }
        if(getlog){
            this.ctx.service.weixin.sendServiceMessage({content:'你已经领取过了哦'});
        }else{
            // 更新用户表
            await this.giveCoin({coin:coin.coin,message:keyword,remark:'口令红包',openid,type:1,giver:coin.id})
             // await this.ctx.model.User.update(
             //     {times:Sequelize.literal(`times + ${coin.coin}`)},
             //     { where:{ openid }});
             //更新红包表
             await this.ctx.model.CodeCoin.update({
                log:Sequelize.literal(`log + 1`)
             },{where:{id:coin.id}});
             //领取记录表 插入记录
             await this.ctx.model.CodeCoinLog.create({
                uid:user.id,
                cid:coin.id
            })
            this.ctx.service.weixin.sendServiceMessage({content:`大吉大利 今晚吃鸡~ \n恭喜你获得${coin.coin}个粮票\n 已发放到你的余额 请注意查收 么么哒~`});
        }
        console.log(`调试:是否存在领取记录`, getlog)


    }


    //用户签到
    async signin({openid}){
         const user = await  this.ctx.model.User.findOne({
             attributes:["last_sign","conn_sign","id","times"],
             where:{openid}
         });
         if(!user.last_sign || new Date(user.last_sign)){

         }

         let now = new Date(); //当前时间
         let nowStr = `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
         let last_sign = new Date(user.last_sign) //最后签到时间
         let lastSignStr =`${last_sign.getFullYear()}${last_sign.getMonth()}${last_sign.getDate()}`;
         let maxInterval = 24 * 60 * 60; // 最大间隔秒数
         let nowInterval =(now.getTime() - last_sign.getTime()) / 1000 //当前间隔时间
         const config =await this.ctx.service.mpconfig.getAllConfig();
         console.log(`调试:获取配置`, config)
        if(!config.sign){
            await  this.ctx.service.weixin.sendServiceMessage({content:`签到功能暂未开放 敬请期待哦`});
            return  0;
        }
        if(lastSignStr == nowStr){
             console.log(`调试:今日已签到[${nowStr}][${lastSignStr}]`);
             await  this.ctx.service.weixin.sendServiceMessage({content:`您今日已签到成功 不用重复签到哦`});
             return ;
         }
        let addCoin= 0 ;
        if(nowInterval < maxInterval){ // 是连续签到
             console.log(`调试:签到成功`);
            addCoin = config.sign_coin  + (user.conn_sign + 1)
            this.ctx.model.User.update({
                  last_sign:now,
                  times:Sequelize.literal(`times + ${addCoin}`),
                  conn_sign: Sequelize.literal(`conn_sign + 1`)
              },{where:{openid}});
            await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n粮票余额:+${addCoin}\n当前粮票:${user.times + addCoin}\n您已连续签到${(user.conn_sign + 1)}天\n`})
         } else { //不是连续签到
             console.log(`调试:不是连续签到`);
            addCoin = config.sign_coin  ;
            this.ctx.model.User.update({
                 last_sign:now,
                 times:Sequelize.literal(`times + ${addCoin}`),
                 conn_sign: 0
             },{where:{openid}});
            await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n粮票余额:+${addCoin}\n当前粮票:${user.times + addCoin}\n连续签到可获取额外粮票哦`})
        }

        // console.log(`调试:签到的用户信息[${user.id}]` ,nowStr,new Date(user.last_sign).getDate());

    }

    //用户取关
    async unsubscribe({openid}) {
        const {ctx} = this;
        return await ctx.service.user.update({subscribe: 0}, {openid})
    }

    // 用户关注
    async subscribe({openid}) {
        const {ctx} = this;
        console.log(`用户关注:openid[${openid}]`)
        let userinfo = await ctx.service.weixin.getUserInfo({openid});  // 从微信服务器获取用户详细信息
        console.log(`调试:用户信息userinfo返回值`, userinfo);
        let father = userinfo.qr_scene;    //从用户详细信息中后去推广码信息
        let exist = await ctx.service.user.exist({where: {openid}});   // 判断用户是否已经在数据库里存在
        let user = {...userinfo};
        let allConfig = await this.ctx.service.mpconfig.getAllConfig();
        // return  0;
        if (!exist) {   // 如果用户不存在
            this.ctx.service.weixin.reply({content: allConfig.subscribe_msg}); // 回复消息
            user['times'] = ctx.mpconfig.join_coin; // 新用户默认赠送粮票个数
            user['father'] = father; // 新用户送两个次数
            user['subscribe'] = 1; // 是否关注
            user['mid'] = this.ctx.mpconfig.id; // 所属 公众号
           let res =  await ctx.service.user.add(user);
           console.log(`调试:新增用户回调`, res);
            if (father !== 0) {
                console.log(`调试:邀请者不为空`, father);
                let fer = await ctx.service.user.exist({
                    where: {id: father},
                    col: ["id", "times", "nickname", "openid"],
                    showCol: true
                });
                console.log(`调试:邀请者 详细信息`, fer);
                let content = `邀请成功！🎉\n您成功邀请了${user.nickname}\n您的粮票:+${this.ctx.mpconfig.ex_coin}\n当前余额:${fer.times + this.ctx.mpconfig.ex_coin}`
                // this.ctx.service.user.giveCoin({openid:fer.openid,coin:this.ctx.mpconfig.ex_coin,type:2,remark:'邀请用户',message:content,giver:})
                let updatefer = await ctx.service.user.update({times: fer.times + this.ctx.mpconfig.ex_coin}, {id: father});
                this.ctx.service.weixin.sendServiceMessage({content, openid: fer.openid});
                console.log(`调试:更新邀请者粮票`, updatefer);
                content = `受邀成功! \n 您的粮票: +${ctx.mpconfig.in_coin}\n 邀请者[${fer.nickname}]粮票: + ${this.ctx.mpconfig.ex_coin}`;
                let sendRes = await ctx.service.weixin.sendServiceMessage({content});
                console.log(`调试:完成后客服消息推送返回值`, sendRes)
            }
        } else {  // 如果用户已存在
            this.ctx.service.weixin.reply({content: allConfig.comeback_msg}); // 回复消息
            user['subscribe'] = 1; // 是否关注
            let updateResult = await ctx.service.user.update(user, {openid});
            console.log(`调试:用户已存在 信息更新成功`, updateResult)
        }


    }
    async list2({mp,page =1 ,size =10}){
        let condition = this.ctx.request.query;
        const fuzzy = condition.word || '';
        const fuzzyCloumn = ['nickname','phone']; // 模糊匹配字段
        const cloumn = ["city","subscribe","sex","father_name"]; //精确匹配字段
        delete  condition.word;
        delete condition.page;
        delete  condition.size;
        let str ='WHERE';
        for(let key in condition){
            // let flag = false;
            if(cloumn.includes(key)){
                if(condition[key] !== ''){
                    str+= ` ${key} like '%${condition[key]}%' AND`
                }
            }

        }
        str += "(";
        for(let col of fuzzyCloumn){
            str+= ` ${col} like '%${fuzzy}%' OR`
        }
        str += " 0 )";
        // str+= ' 1';
        console.log(`调试:查询条件`, str);
        const WHERE = str;
        const LIMIT = ` LIMIT ${(page - 1) * size},${size}`;

        const ORDERBY = condition.sortby !== ''?  `ORDER BY ${condition.sortby} ${condition.order}`:``;

        // const count_sql = `SELECT COUNT(1) as total FROM users WHERE father IN (SELECT id AS fid FROM users ${WHERE} ) AND mid =${mp}`;
        const total_sql = `SELECT id,mid,openid,subscribe,father_name,nickname,phone,fid,ex_count,recharge_count,get_count,city,sex,times,week_ex,month_ex,all_ex,created_at FROM  users 
                     LEFT  JOIN (SELECT id AS fid,nickname AS father_name FROM users) fu ON  users.father = fu.fid
                     LEFT  JOIN (SELECT father as et_fid,COUNT(1) ex_count FROM users GROUP BY father  )  AS et  ON users.id = et.et_fid
                     LEFT  JOIN (SELECT sum(pay_price) recharge_count,buyer FROM recharge GROUP BY buyer) AS rt ON users.id = rt.buyer
                     LEFT  JOIN (SELECT count(1) get_count, uid FROM log GROUP BY uid ) AS lt ON  users.id = lt.uid ${WHERE} AND mid =${mp}`;
        const sql = `${total_sql} ${ORDERBY} ${LIMIT} `;
        // console.log(`调试:`, this.config.sequelize);
        const mysql =new Sequelize(this.config.sequelize);
        let results =await  mysql.query(sql,{ type: mysql.QueryTypes.SELECT});
        let total =await  mysql.query(total_sql,{ type: mysql.QueryTypes.SELECT});
        total = total.length ;
        console.log(`调试:查询结果`, total);
        // return  result[0];
        return  {total,size,page,results}


    }

    async list({mp, page = 1, size = 10}) {
        console.log(`调试:接收到size[${size}],[${typeof(size)}]`);
        size = Number(size);
        let count =await this.ctx.model.User.findAll({
            attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'total']],
            where: {mid: mp}
        });
        const total  = count[0]['dataValues']['total'];
        // console.log(`调试:总记录数`,count[0], count[0]['dataValues']['total']);
        let results = await this.ctx.model.User.findAll({
            attributes: {exclude: []},
            where: {mid: mp},
            offset: (page - 1) * size,
            order:[ ['created_at', 'DESC']],
            limit: size
        });

        for(let i in results){
            let ex_count = await  this.ctx.model.User.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'ex_count']],
                where:{
                    father:results[i].id
                }
            });

            let get_count = await  this.ctx.model.Log.findAll({
                attributes: [[Sequelize.fn('COUNT', 1), 'get_count'],[Sequelize.fn('SUM', Sequelize.col('amount')), 'get_money_count']],
                where:{
                    uid:results[i].id
                }
            });

            let father = await  this.ctx.model.User.findOne({
                attributes:['nickname','phone','id'],
                where:{
                    id:results[i].father
                }
            });
            let recharge  = await  this.ctx.model.Recharge.findAll({
                attributes:[[Sequelize.fn('SUM',Sequelize.fn("BINARY",Sequelize.col('pay_price'))), 'recharge_count']],
                where:{
                    buyer:results[i]['id']
                }
            })



            results[i]['dataValues']["ex_count"] = ex_count[0]['dataValues']['ex_count'];
            results[i]['dataValues']["get_count"] = get_count[0]['dataValues']['get_count'];
            console.log(`调试:充值记录查询`,recharge, recharge[0]['dataValues']['recharge_count'])
            if(recharge[0]['dataValues']['recharge_count']){
                results[i]['dataValues']["recharge_count"] = recharge[0]['dataValues']['recharge_count'];
            }else{
                results[i]['dataValues']["recharge_count"] = 0;
            }
            results[i]['dataValues']["get_money_count"] = get_count[0]['dataValues']['get_money_count'];

            if(father){
                results[i]['dataValues']["father"] = father['nickname'] || father['id'];
            }else{
                results[i]['dataValues']["father"] = "未填写";
            }
            // console.log(`调试:用户[${results[i].id}]的邀请用户信息`,  results[i]["ex_count"]);


        }
        // console.log(`调试:`, results);

       // results = await  results.map(async item =>{
       //
       //     item["ex_count"] = item["ex_count"][0]['dataValues']['ex_count']
       //     console.log(`调试:用户[${item.id}]的邀请用户信息`,  item["ex_count"]);
       //     return item;
       // })

        // results = Object.assign(result,{});
        return  {total,size,page,results};

    }

    async add(user) {
        return await this.ctx.model.User.create(user);
    }

    async select({col = [], where = {}}) {
        return await this.ctx.model.User.findAll({
            attributes: col,
            where
        })
    }

    async findOne({col = ["id"], where = {}} = {}) {
        return await this.ctx.model.User.findOne({
            attributes: col,
            where
        })

    };

    // showCol字段  如果查询结果存在  是否返回数据  默认false 返回 布尔值
    async exist({where = {}, col = ["id"], showCol = false}) {
        console.log(`调试:是否显示字段`, showCol);

        let result = await this.select({col, where});
        // if(showCol){
        //     if(Boolean(result.length) ){
        //         return  result[0]
        //     }else{
        //         return
        //     }
        // }
        return showCol ? (Boolean(result.length) ? result[0].dataValues : false) : Boolean(result.length)
    }

    async update(map, condition) {
        console.log(`调试:要更新的字段`, map);
        return await this.ctx.model.User.update(map, {where: condition})
    }

};
