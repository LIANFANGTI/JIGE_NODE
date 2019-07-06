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
      let res = await  this.ctx.service.mpconfig.checkToken();
      let { code } = this.ctx.request.query;
      this.ctx.body = this.ctx.service.jige.getAccessToken({code});
    }catch (e) {
      this.ctx.body = e
    }


  }
}

module.exports = JigeController;
