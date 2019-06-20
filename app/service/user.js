const { Service } = require("egg")
module.exports = class UserService extends Service {

 //用户取关
 async unsubscribe({openid}){
     const { ctx } =this;
     return  await ctx.service.user.update({subscribe: 0}, {openid})
 }
 // 用户关注
 async subscribe({openid}){
     const { ctx } =this
     let userinfo = await ctx.service.weixin.getUserInfo({openid});  // 从微信服务器获取用户详细信息
     console.log(`调试:用户信息userinfo返回值`, userinfo);
     let father = userinfo.qr_scene;    //从用户详细信息中后去推广码信息
     let exist = await ctx.service.user.exist({where: {openid}});   // 判断用户是否已经在数据库里存在
     let user = {...userinfo};
     if (!exist) {   // 如果用户不存在
         this.ctx.service.weixin.reply({content: '谢谢关注 ！NM$L! 💖\n 点击下方一键红包菜单即可领取红包 \n'}); // 回复消息
         user['times'] = ctx.mpconfig.join_coin; // 新用户默认赠送积分个数
         user['father'] = father; // 新用户送两个次数
         user['subscribe'] = 1; // 是否关注
         await ctx.service.user.add(user);
         if (father !== 0) {
             console.log(`调试:邀请者不为空`, father);
             let fer = await ctx.service.user.exist({
                 where: {id: father},
                 col: ["id", "times", "nickname"],
                 showCol: true
             });
             console.log(`调试:邀请者 详细信息`, fer);
             let updatefer = await ctx.service.user.update({times: fer.times + this.ctx.mpconfig.ex_coin}, {id: father});
             console.log(`调试:更新邀请者积分`, updatefer);
             let sendRes = await ctx.service.weixin.sendServiceMessage({content: `受邀成功! \n 您的积分: +${ctx.mpconfig.join_coin}\n 邀请者[${fer.nickname}]积分: + ${this.ctx.mpconfig.ex_coin}`})
             -
             console.log(`调试:完成后客服消息推送返回值`, sendRes)
         }
     } else {  // 如果用户已存在
         this.ctx.service.weixin.reply({content: '欢迎回来 ！NM$L! 💖\n 点击下方一键红包菜单即可领取红包 \n'}); // 回复消息
         user['subscribe'] = 1; // 是否关注
         let updateResult = await ctx.service.user.update(user, {openid});
         console.log(`调试:用户已存在 信息更新成功`, updateResult)
     }



 }


  async add(user) {
    return await this.ctx.model.User.create(user);
  }
  async select({col=[],where = {}}){
      return  await this.ctx.model.User.findAll({
        attributes:col,
        where
      })
  }
  async findOne({col=["id"],where = {}} = {}){
      return  await  this.ctx.model.User.findOne({
          attributes:col,
          where
      })

  };
  // showCol字段  如果查询结果存在  是否返回数据  默认false 返回 布尔值
  async exist({where={},col = ["id"],showCol = false}){
      console.log(`调试:是否显示字段`, showCol);

      let result = await  this.select({col,where});
      // if(showCol){
      //     if(Boolean(result.length) ){
      //         return  result[0]
      //     }else{
      //         return
      //     }
      // }
      return  showCol ? ( Boolean(result.length) ? result[0].dataValues : false) : Boolean(result.length)
  }
  async update(map,condition){
      console.log(`调试:要更新的字段`, map);
      return  await this.ctx.model.User.update(map,{where:condition})
  }

};
