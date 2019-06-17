'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const options = {
    'token': 'p4d0lfS9LR0aaHh0',           //填写你设定的Token
    'encodingaeskey': 'NfJU7O3k83Mr7KTP3gdHKIAyHKvRSBoAkWEO3cCvGjc',  //填写加密用的EncodingAESKey
    // 'appid': 'wx2e707ecbc65368f3',                  //填写高级调用功能的appid
    // 'appsecret': '092a7a30fb235d10edca16e91405f2f0'   //填写高级调用功能的密钥
    'appid': 'wxe6209b6d5f2872a6',                  //测试号
    'appsecret': 'af758ed398ffe6395bfff0ff9b41ff56'   //测试号
};
module.exports = class WeixinService extends Service {
    // 获取access_token
    async getAccessToken() {
        let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${options.appid}&secret=${options.appsecret}`;
        return await this.ctx.service.http.get({url});
    }

    //创建二维码
    async qrcode({expire_seconds = 604800, scene_id = 1} = {}) {
        let {access_token} = await this.getAccessToken();
        let url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`;
        let data = {
            expire_seconds,       // 二维码有效时间 单位秒 最大值为2592000（30天） 默认有效期 30s
            action_name: "QR_SCENE",  // 二维码类型  QR_SCENE 临时型 | QR_STR_SCENE  临时字符串| QR_LIMIT_SCENE  永久| QR_LIMIT_STR_SCENE 永久字符串
            action_info: {
                scene: {
                    scene_id: scene_id,          // 整型场景值ID 临时型二维码为 32位非0整形 永久型二维码 取值范围 [1,100000]
                    "scene_str": 'test001',
                    custom: '练方梯'
                }
            }, // 二维码详细信息
            scene_id: 101,          // 整型场景值ID 临时型二维码为 32位非0整形 永久型二维码 取值范围 [1,100000]
            scene_str: 'lft0000000001'         // 字符串型场景值ID  长度范围为[1,64]
        }
        return this.ctx.service.http.post({url, data})
    }

    //获取用户信息
    async getUserInfo({openid = ''}) {
        // console.log(`openid:[${openid}]`)
        let {access_token} = await this.getAccessToken();
        // console.log(`调试获取用户信息:access_token[${access_token}]`);

        let url = `https://api.weixin.qq.com/cgi-bin/user/info?openid=${openid}&access_token=${access_token}&lang=zh_CN`;
        // console.log(`调试:最终请求的url[${url}]`)
        return await this.ctx.service.http.get({url}).then(res => {
            console.log(`调试:用户信息接口返回值`, JSON.stringify(res));
            if (res.errcode) {
                return Promise.reject({from: '获取用户信息接口', result: res});
            } else {
                return Promise.resolve(res);
            }
        });
    }

    async getMenu() {
        let {access_token} = await this.getAccessToken();
        let url = `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${access_token}`;

        return await this.ctx.service.http.get({url})
    }

    async createMenu() {
        let {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${access_token}`;
        /*
                 { "type": "view",  "name": "拼手气", "url": "http://www.soso.com/" }, //链接
                 {  "type": "miniprogram", "name": "wxa",  "url": "http://mp.weixin.qq.com", "appid": "wx286b93c14bbf93aa","pagepath": "pages/lunar/index"}, // 小程序
                 { "type": "click", "name": "赞一下我们", "key": "V1001_GOOD"} // 按钮
        * */
        let data = {
            "button": [
                {
                    "type": "click",
                    "name": "使用教程",
                    "key": "SYJC"
                },
                {
                    "name": "一键红包",
                    "sub_button": [
                        { "type": "click", "name": "拼手气", "key": "PSQ"},
                        { "type": "click", "name": "品质联盟", "key": "PZLM"}
                    ]
                },
                {
                    "name": "个人中心",
                    "sub_button": [
                        { "type": "click", "name": "推广码", "key": "TGM"},
                        { "type": "click", "name": "每日签到", "key": "MRQD"},
                        { "type": "click", "name": "账户充值", "key": "ZHCZ"},
                        { "type": "click", "name": "余额查询", "key": "YECX"},
                        { "type": "click", "name": "联系客服", "key": "LXKF"},
                    ]
                }
                ]
        }
        return  await this.ctx.service.http.post({url,data})
    }

    // 添加客服
    async addServive(data){
        const {access_token} = await this.getAccessToken();
        const  url =`https://api.weixin.qq.com/customservice/kfaccount/add?access_token=${access_token}`
        data = {
            "kf_account" : "admin@lianfangti",
            "nickname" : "1号技师",
            "password" : "123456"
        }
        return   await  this.ctx.service.http.post({url,data})
    }
    async getCustomService(){
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/customservice/getkflist?access_token=${access_token}`
        return   await  this.ctx.service.http.get({url})
    }

    // 发送客服消息
    async sendServiceMessage({type = 'text',content =''}) {
        const { access_token } = await  this.getAccessToken();
        const url =`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`;
        let data = {
            "touser":this.ctx.request.body.FromUserName || '',
            "msgtype":`${type}`,
            "text":
                {
                    "content":`${content}`
                }
        };
        console.log(`\n\n *************[${new Date()}]客服消息发送日志 *************[ `);
        console.log(`\n发送数据:\n`, data , "\n\n");


        return  await  this.ctx.service.http.post({url,data})
    }
    // 发送模板消息
    async sendTemplateMessage(openid){
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`;
        let data  = {
            "touser":`o-GhE5lF3AND63TVdilZMNlNbbNk`,
            "template_id":"Uo5zXHQk8kPhs-BjOSwaNU3I0R9YyV4lDFgZ6kHMU4w",
            "url":"http://weixin.qq.com/download",
            // "miniprogram":{ //点击打开小程序
            //     "appid":"xiaochengxuappid12345",
            //     "pagepath":"index?foo=bar"
            // },
            "data":{
                "first": {
                    "value":"发送成功",
                    "color":"#173177"
                },
                "keyword1":{
                    "value":'18757739042',
                    "color":"#173177"
                },
                "keyword2":{
                    "value":new Date(),
                    "color":"#173177"
                },
                "remark":{
                    "value":"请在30分钟内回复6位短信验证码 如果这不是您的手机号 您可重新发送手机号绑定",
                    "color":"#173177"
                }
            }
        }

        return  await  this.ctx.service.http.post({url,data})

    }

}
