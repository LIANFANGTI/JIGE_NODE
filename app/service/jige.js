const Service = require("egg").Service;
const cache = require('memory-cache');
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
    let wxInfo =   await  this.ctx.service.http.get({
      url
    });

    let userInfo = await  this.ctx.model.User.findOne({
      attributes:{exclude: []},
      where:{openid}
    });
    console.log(`调试:获取到系统里用户信息`, userInfo);
    return userInfo;

  }
  // token刷新
  async refresToken({refresh_token,grant_type='refresh_token'}){

  }


};
