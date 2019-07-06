'use strict';
const Controller = require('egg').Controller;
const fs = require('fs');
const utils =require("../public/utils");
class JigeController extends Controller {
  async images() {
    const { ctx } = this;
    const { filename } = ctx.params;
    this.ctx.set("Content-Type", "image/png");
    const path = `${this.config.baseDir}/app/public/images/${filename}`;
    console.log(`调试:获取参数`, filename)
    let buffer = await  utils.readImageToBuffer(path);
    console.log(`调试:`, buffer)
    this.ctx.body = buffer
  }
  async getAccessToken(){
    try {
      console.log(`调试:进来了`, this.ctx.request.query)
      let res = await  this.ctx.service.mpconfig.checkToken();
      let { code } = this.ctx.request.query;
      let data= await this.ctx.service.jige.getAccessToken({code});
      this.ctx.body ={
        code:0,
        data
      }
    }catch (e) {
      this.ctx.body = e
    }
  }
  async getUserInfo(){
     await  this.ctx.service.mpconfig.checkToken();
    let { code } = this.ctx.request.query;
   try {
     let { access_token,openid }= await  this.ctx.service.jige.getAccessToken({code});

     let userInfo = await  this.ctx.service.jige.getUserInfo({ access_token,openid })
     console.log(`调试:获取到用户信息`,userInfo);
     this.ctx.body=  {
       code:0,
       data:userInfo
     }
   }catch (e) {
     console.log(`调试:getUserInfo出错`, e);
     this.ctx.body =e
   }
  }

  async getLoginUrl(){
    let {token} = await  this.ctx.service.mpconfig.checkToken();
    const {appid}= this.ctx.mpconfig;
    const redirect_uri = encodeURI(`https://lft.easy.echosite.cn`);
    const response_type = `code`;
    const scope = `snsapi_userinfo`;
    const  state =token;

    let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}#wechat_redirect`
    this.ctx.body = {
      code:0,
      data:{
        url
      }
    }
  }
}

module.exports = JigeController;
