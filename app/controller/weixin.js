const Controller = require("egg").Controller;
const crypto = require("crypto");
module.exports = class WeixinController extends Controller {
  async index() {
    const { ctx } = this;
    const token = 'p4d0lfS9LR0aaHh0';
    let query = ctx.request.query;
    let array = [token, query.timestamp, query.nonce];
    let key = array.sort().join("");
    console.log(`调试:key=[${key}]`,array)
    let sha1 = crypto.createHash("sha1").update(key).digest("hex");
    if(sha1 == query.signature){
       ctx.body= query.echostr
    }else{
      ctx.body = "Token 验证出错"
    }



    console.log(`调试:接收到的参数`,query)


  }
};
