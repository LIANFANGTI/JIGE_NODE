'use strict';
const {loadImage} = require('canvas');
const Controller = require('egg').Controller;
const fs = require('fs');
const utils =require("../public/utils")
class RanderController extends Controller {
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
}

module.exports = RanderController;
