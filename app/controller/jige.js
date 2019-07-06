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
    let a=1
  }
}

module.exports = JigeController;
