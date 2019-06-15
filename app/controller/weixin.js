const Controller = require("egg").Controller;
const crypto = require("crypto");
const requset = require('request-promise');
const qr = require('qr-image');


module.exports = class WeixinController extends Controller {
    async index() {
        const {ctx} = this;
        const token = 'p4d0lfS9LR0aaHh0';
        let query = ctx.request.query;
        let data = ctx.request.body;
        console.log(`\n\n==================================[${new Date()}]接收到网络请求==================================`);
        console.log(`调试:接收到的GET参数`, query);
        console.log(`调试:接收到的POST参数`, data);
        // console.log(`调试:输出一整个request`, ctx.request);
        if (ctx.request.method === "POST") {
            ctx.set("Content-Type", "text/xml")
            if (data.Event) {
                switch (data.Event) {
                    case "subscribe":
                        ctx.body = `<xml>
                                      <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
                                      <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
                                      <CreateTime>${new Date().getTime()}</CreateTime>
                                      <MsgType><![CDATA[text]]></MsgType>
                                      <Content><![CDATA[你好]]></Content>
                                    </xml>`;
                        break;
                }
            }else if(data.MsgType){
                ctx.body = `<xml>
                              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
                              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
                              <CreateTime>${new Date().getTime()}</CreateTime>
                              <MsgType><![CDATA[text]]></MsgType>
                              <Content><![CDATA[你是说${data.Content}?]]></Content>
                            </xml>`
            }


        } else {
            let array = [token, query.timestamp, query.nonce];
            let key = array.sort().join("");
            // console.log(`调试:key=[${key}]`, array)
            let sha1 = crypto.createHash("sha1").update(key).digest("hex");

            if (sha1 == query.signature) {
                ctx.body = query.echostr
            } else {
                ctx.body = "Token 验证出错"
            }
        }


    }

    //生成二维码
    async qr() {
        const {ctx} = this
        let res = await ctx.service.weixin.qrcode({info: {name: '练方梯的二维码'}});
        let query = ctx.request.query;
        let type = query.type || 'json';
        if (type == 'image') {
            ctx.set("Content-Type", "image/png")
            let img = qr.image(res.url, {type: 'png'});
            ctx.body = img
        } else {
            ctx.body = res
        }
    }

    async getAccessToken() {
        const {ctx} = this;
        ctx.body = await ctx.service.weixin.getAccessToken();
    }
};
