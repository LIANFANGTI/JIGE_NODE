const Controller = require("egg").Controller;
const crypto = require("crypto");
const wechat = require('wechat-node-sdk');
const requset = require('request-promise');
const qr = require('qr-image');

const options = {
    'token': 'p4d0lfS9LR0aaHh0',           //填写你设定的Token
    'encodingaeskey': 'NfJU7O3k83Mr7KTP3gdHKIAyHKvRSBoAkWEO3cCvGjc',  //填写加密用的EncodingAESKey
    'appid': 'wx2e707ecbc65368f3',                  //填写高级调用功能的appid
    'appsecret': '092a7a30fb235d10edca16e91405f2f0'   //填写高级调用功能的密钥
};
module.exports = class WeixinController extends Controller {
    async index() {
        const {ctx} = this;
        const token = 'p4d0lfS9LR0aaHh0';
        let query = ctx.request.query;
        let data = ctx.request.body;
        console.log(`\n\n调试:==================================接收到网络请求==================================`);
        console.log(`调试:接收到的GET参数`, query);
        console.log(`调试:接收到的POST参数`, data);

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

    async test() {
        const {ctx} = this;
        let getAccessTokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${options.appid}&secret=${options.appsecret}`;
        try {
            let {access_token} = await ctx.service.http.get({url: getAccessTokenUrl});
            console.log(`调试:access_token获取成功`, access_token)
            try {
                let createQrcodeUrl = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`;
                let data = {
                    "expire_seconds": 604800,
                    "action_name": "QR_STR_SCENE",
                    "action_info": {"scene": {"scene_str": "test"}}
                };
                let res = await requset({
                    method: 'POST',
                    url: createQrcodeUrl,
                    json: true,
                    body: data
                });
                console.log(`调试:创建二维码返回值`, res);
                let img = qr.image(res.url, {type: 'png'});
                console.log(`调试:生成的图片`, img)
                ctx.set("Content-Type", "image/png")
                ctx.body = img
                // ctx.body = `<img src=''/>`

            } catch (e) {
                console.error(`调试:创建 二维码失败`, e)
            }

        } catch (e) {
            console.log(`调试:获取token出错`, e)
        }
    };
}
