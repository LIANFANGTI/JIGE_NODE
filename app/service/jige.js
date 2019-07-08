const Service = require("egg").Service;
const cache = require('memory-cache');
const Sequelize = require('sequelize');

module.exports = class JigeService extends Service {
  async index() {
    return await this.ctx.model.Page.findAndCountAll({});
  }
  async getAccessToken({code}) {
    const {id } =this.ctx.mpconfig;
    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.ctx.mpconfig.appid}&secret=${this.ctx.mpconfig.appsecret}&code=${code}&grant_type=authorization_code`;
    // let access_token = '';
    let access_token =  await this.ctx.service.http.get({url});
    console.log(`调试:获取到的AccessToken`, access_token);
    return access_token
  }
  async getUserInfo({openid,access_token}){
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    // let wxInfo =   await  this.ctx.service.http.get({
    //   url
    // });

    let userInfo = await  this.ctx.model.User.findOne({
      attributes:{exclude: []},
      where:{openid}
    });
    // console.log(`调试:获取到系统里用户信息`, userInfo);
    return userInfo;

  }
  // token刷新
  async refresToken({refresh_token,grant_type='refresh_token'}){

  }

  async checkXToken(){
    let xToken = this.ctx.headers["x-token"];
    if(!xToken){
      console.log(`调试:没有XToken`, this.ctx.headers);
      return  Promise.reject({
        code:403,
        msg:'无效X-Token'
      })
    }else{
      console.log(`调试:获取到的XToken`, xToken);
    }

    let userInfo =await this.ctx.model.User.findOne({
      attributes:["id","openid","nickname","mid","last_sign","conn_sign"],
      where:{
        openid:xToken
      }
    });

    if(!userInfo){
      return  Promise.reject({
        code:403,
        msg:'无效X-Token'
      })
    }
    let mpconfig = await  this.ctx.service.mpconfig.getAllConfig(userInfo.mid);
    let context = {...userInfo.dataValues,mpconfig:{...mpconfig.dataValues}};
    return  context
  }

  //检查签到
  async checkSignin(){
    let context = await  this.checkXToken();
    // console.log(`调试:从XToken中获取的信息`, context)
    // console.log(`调试:最后签到时间`, context.dataValues.id);

    let now = new Date(); //当前时间
    let nowStr = `${now.getFullYear()}${now.getMonth()}${now.getDate()}`; //当前时间字符串
    let last_sign = new Date(context.last_sign); //最后签到时间
    let lastSignStr =`${last_sign.getFullYear()}${last_sign.getMonth()}${last_sign.getDate()}`; //最后签到时间字符串
    // console.log(`调试:`, lastSignStr == nowStr)
    return {
      code:0,
      data:{
        signed: lastSignStr == nowStr,
        conn_sign:context.conn_sign,
        lastSignStr ,
        nowStr
      }
    }
  }

  async signin(){
    console.log(`调试:开始调用`)
    const user = await this.checkXToken();
    let {openid} = user;
    let now = new Date(); //当前时间
    let nowStr = `${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
    let last_sign = new Date(user.last_sign); //最后签到时间
    let lastSignStr =`${last_sign.getFullYear()}${last_sign.getMonth()}${last_sign.getDate()}`;
    let maxInterval = 24 * 60 * 60; // 最大间隔秒数
    const config = user.mpconfig;
    // console.log(`调试:获取配置`, config);
    if(!config.sign){
      return  Promise.reject({
        code:500,
        msg:'签到功能未开放'
      });

    }

    if(lastSignStr == nowStr){
      console.log(`调试:今日已签到[${nowStr}][${lastSignStr}]`);
      return  Promise.reject({
        code:500,
        msg:'今日已签到'
      });
    }
    let addCoin= 0 ;
    let nd = new Date(new Date(new Date().toLocaleDateString()).getTime());
    let ld = new Date(new Date(last_sign.toLocaleDateString()).getTime());
    let nowInterval =(nd-ld ) / 1000 //当前间隔时间

    console.log(`调试:判断是否连续签到 ]`,nowInterval , maxInterval,nowInterval <= maxInterval)  ;
    if(nowInterval <= maxInterval){ // 是连续签到
      console.log(`调试:签到成功`);
      addCoin = config.sign_coin  + (user.conn_sign + 1);
      await  this.ctx.model.User.update({
        last_sign:now,
        times:Sequelize.literal(`times + ${addCoin}`),
        conn_sign: Sequelize.literal(`conn_sign + 1`)
      },{where:{openid}});
      // await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n您已连续签到${(user.conn_sign + 1)}天\n`})
      return  {
        code:0,
        data:{
          addCoin,
          conn_sign:user.conn_sign+1
        },
        msg:'签到成功'
      }
    } else { //不是连续签到
      console.log(`调试:不是连续签到`);
      addCoin = config.sign_coin  ;
      await this.ctx.model.User.update({
        last_sign:now,
        times:Sequelize.literal(`times + ${addCoin}`),
        conn_sign: 0
      },{where:{openid}});
      return {
        code:0,
        data:{
          addCoin,
          conn_sign:user.conn_sign+1
        },
        msg:'签到成功'

      }
      // await  this.ctx.service.weixin.sendServiceMessage({content:`签到成功\n积分余额:+${addCoin}\n当前积分:${user.times + addCoin}\n连续签到可获取额外积分哦`})
    }

    // console.log(`调试:签到的用户信息[${user.id}]` ,nowStr,new Date(user.last_sign).getDate());

  }



};
