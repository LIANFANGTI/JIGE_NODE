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
        if (ctx.request.method === "POST") {
            if (data.Event) {
                switch (data.Event) {
                    case "subscribe":
                        ctx.body = `<xml>
                                      <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
                                      <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
                                      <CreateTime>${new Date().getTime()}</CreateTime>
                                      <MsgType><![CDATA[text]]></MsgType>
                                      <Content><![CDATA[谢谢关注 你妈死了！ \n 你本次关注的二维码信息是 (${data.Ticket})]]></Content>
                                    </xml>`;
                        break;
                }
            }else if(data.MsgType){
               this.reply({content:'好的我知道了'});
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

    async reply({type = 'text', content = ''}){
        const { ctx } = this;
        const data = ctx.request.body;

        const head = `<xml><ToUserName><![CDATA[${data.FromUserName}]]></ToUserName> <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
                      <CreateTime>${new Date().getTime()}</CreateTime> <MsgType><![CDATA[${type}]]></MsgType>`;
        let body ;
        const end =`</xml>`;
        switch (type) {
            case 'text':
                body = `${head} <Content><![CDATA[${content}]]></Content>`;
            break;
        }
        ctx.set("Content-Type", "text/xml");
        ctx.body = `${head}${body}${end}`
    }
};
