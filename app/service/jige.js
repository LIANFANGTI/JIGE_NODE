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
  //是否领取过 加客服口令
    let added = await  this.ctx.model.CodeCoinLog.findAll({
      attributes:["id"],
      where:{
        cid:14,
        uid:userInfo.id
      }
    })
    // userInfo.added = 111;
    // console.log(`调试:获取到系统里用户信息`, userInfo);
    return {...userInfo.dataValues,added:added.length ? true:false};

  }
  // token刷新
  async refresToken({refresh_token,grant_type='refresh_token'}){

  }

  async checkXToken({checkToken=false}={}){
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
      attributes:["id","openid","nickname","mid","last_sign","conn_sign",'week_ex','month_ex','all_ex'],
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
    this.ctx.mpconfig =mpconfig;
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

  /**
   * 签到
   * @returns {Promise<Promise<Promise<never>|{msg, code, data}>|{msg: string, code: number, data: {addCoin: (*|number), conn_sign: *}}>}
   */
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
      // {coin,message,remark,type = 0,openid,giver}
      await this.ctx.service.user.giveCoin({
        coin:addCoin,
        message:'签到成功',
        remark:'每日签到',
        type:2,
        openid,
        giver:0
      });
      await  this.ctx.model.User.update({
        last_sign:now,
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
      await  this.ctx.model.User.update({
        last_sign:now,
        conn_sign: Sequelize.literal(`conn_sign + 1`)
      },{where:{openid}});
      await this.ctx.service.user.giveCoin({
        coin:addCoin,
        message:'签到成功',
        remark:'每日签到',
        type:2,
        openid,
        giver:0
      });
      // await this.ctx.model.User.update({
      //   last_sign:now,
      //   conn_sign: 0
      // },{where:{openid}});
      return {
        code:0,
        data:{
          addCoin,
          conn_sign:1
        },
        msg:'签到成功'

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
    let drawer = new Drawer(414,736);
    // let image =;
    await  drawer.setBackgroundImage(`${this.config.baseDir}/app/public/images/hongbao_v2.png`);
    // context.font = '23px Arial';
    let qrCodeBuffer = await this.ctx.service.weixin.qrcode({scene_id: id || 1, type: 'image'});
    // drawer.context.fillText("NM SL",150,150);
    await  drawer.drawElements([
      {
        type:'text',
        content:utils.encode(id),
        color:"white",
        x:-55,
        y:16
      },
      {
        type:'image',
        content:`${this.config.baseDir}/app/public/images/qrcode.png`,
        y:513,
        w:175
      }
    ])
    return  drawer.getDataURL();

  }



};
