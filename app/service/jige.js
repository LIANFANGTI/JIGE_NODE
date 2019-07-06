const Service = require("egg").Service;

module.exports = class JigeService extends Service {
  async index() {
    return await this.ctx.model.Page.findAndCountAll({});
  }
  async getAccessToken() {
    // console.log(`调试:获取TOKEN的地方打印mpconfig`, this.ctx.mpconfig);
    const {id } =this.ctx.mpconfig;
    console.log(`调试:获取到公众号id`, id);
    console.log(`调试:从缓存中取access_token cache.get(${id}_jige_access_token) = [${cache.get(`${id}_jige_access_token`)}]`,)
    // return ;
    // let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.ctx.mpconfig.appid}&secret=${this.ctx.mpconfig.appsecret}`;
    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.ctx.mpconfig.appid}&secret=${this.ctx.mpconfig.appsecret}&code=${code}&grant_type=authorization_code`;
    let access_token = '';
    // cache.del("access_token")
    if (!cache.get(`${id}_jige_access_token`)) {
      console.log(`调试:缓存中不存在 重新获取`);
      access_token = await this.ctx.service.http.get({url}).then(res => {
        if (res.errcode) {
          return Promise.reject({from: '获取TOKEN', result: res})
        } else {
          let {access_token, expires_in} = res;
          // console.log(`调试:开始写入缓存啊啊啊存储时间[${expires_in}]，[${typeof (expires_in)}]`, access_token);
          cache.put(`${id}_jige_access_token`, {access_token,mid:id, time: new Date(), expires_in: expires_in * 1000}, 7200000);
          return Promise.resolve(res)
        }
      }).catch(err => {
        console.log(`调试:获取Token失败`, err)
        return Promise.reject({from: '获取TOKEN', result: err})

      });
      console.log(`调试:获取到access_token`, access_token);
    } else {
      console.log(`调试:缓存中存在直接拿`)
      let res = cache.get(`${id}_jige_jige_access_token`);
      res = await  this.checkAccessToken(res).catch(async err=>{
        console.log(`调试:验证AccessToken失败 重新获取`,err);
        return await this.getAccessToken();
      });

      let {access_token, time} = res
      // console.log(`调试:缓存中存在`, access_token);
      // console.log(`调试:存入时间`, time);
      // console.log(`调试:剩余时间`,7200 - (new Date().getTime() -  time.getTime())/ 1000);
      // res['residue'] = (7200 - (new Date().getTime() - time.getTime()) / 1000)
      return Promise.resolve(res)
    }

    return access_token


  }
};
