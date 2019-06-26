const {Service} = require("egg");
const Sequelize = require('sequelize');

module.exports = class UserService extends Service {

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
            await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n您已连续签到${(user.conn_sign + 1)}天\n`})
         } else { //不是连续签到
             console.log(`调试:不是连续签到`);
            addCoin = config.sign_coin  ;
            this.ctx.model.User.update({
                 last_sign:now,
                 times:Sequelize.literal(`times + ${addCoin}`),
                 conn_sign: 0
             },{where:{openid}});
            await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n连续签到可获取额外积分哦`})
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
            user['times'] = ctx.mpconfig.join_coin; // 新用户默认赠送积分个数
            user['father'] = father; // 新用户送两个次数
            user['subscribe'] = 1; // 是否关注
            user['mid'] = this.ctx.mpconfig.id; // 所属 公众号
            await ctx.service.user.add(user);
            if (father !== 0) {
                console.log(`调试:邀请者不为空`, father);
                let fer = await ctx.service.user.exist({
                    where: {id: father},
                    col: ["id", "times", "nickname", "openid"],
                    showCol: true
                });
                console.log(`调试:邀请者 详细信息`, fer);
                let updatefer = await ctx.service.user.update({times: fer.times + this.ctx.mpconfig.ex_coin}, {id: father});
                let content = `邀请成功！🎉\n您成功邀请了${user.nickname}\n您的积分:+${this.ctx.mpconfig.ex_coin}\n当前余额:${fer.times + this.ctx.mpconfig.ex_coin}`
                this.ctx.service.weixin.sendServiceMessage({content, openid: fer.openid});
                console.log(`调试:更新邀请者积分`, updatefer);
                content = `受邀成功! \n 您的积分: +${ctx.mpconfig.in_coin}\n 邀请者[${fer.nickname}]积分: + ${this.ctx.mpconfig.ex_coin}`;
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
