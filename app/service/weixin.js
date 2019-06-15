'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const options = {
    'token': 'p4d0lfS9LR0aaHh0',           //填写你设定的Token
    'encodingaeskey': 'NfJU7O3k83Mr7KTP3gdHKIAyHKvRSBoAkWEO3cCvGjc',  //填写加密用的EncodingAESKey
    'appid': 'wx2e707ecbc65368f3',                  //填写高级调用功能的appid
    'appsecret': '092a7a30fb235d10edca16e91405f2f0'   //填写高级调用功能的密钥
};
module.exports = class WeixinService extends Service {
    // 获取access_token
    async getAccessToken() {
        let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${options.appid}&secret=${options.appsecret}`;
        return await this.ctx.service.http.get({url});
    }

    //创建二维码
    async qrcode({expire_seconds =604800, info = {}} = {}) {
        let {access_token} = await this.getAccessToken()
        let url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`;
        let data = {
            expire_seconds,       // 二维码有效时间 单位秒 最大值为2592000（30天） 默认有效期 30s
            action_name: "QR_SCENE",  // 二维码类型  QR_SCENE 临时型 | QR_STR_SCENE  临时字符串| QR_LIMIT_SCENE  永久| QR_LIMIT_STR_SCENE 永久字符串
            action_info: info, // 二维码详细信息
            // scene_id: 10000,          // 整型场景值ID 临时型二维码为 32位非0整形 永久型二维码 取值范围 [1,100000]
            //scene_str: 'a0001'         // 字符串型场景值ID  长度范围为[1,64]
        }
        return this.ctx.service.http.post({url, data})
    }

}
