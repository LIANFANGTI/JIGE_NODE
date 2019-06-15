const Controller = require("egg").Controller;
const crypto = require("crypto");
module.exports = class WeixinController extends Controller {
  async index() {
    const { ctx } = this;
    const token = ''
    let query = ctx.request.query;
    console.log(`调试:接收到的参数`,query)


  }
};
