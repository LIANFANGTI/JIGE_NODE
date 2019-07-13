'use strict';
const Service = require('egg').Service;
const requset = require('request');
const qr = require('qr-image');
const cache = require('memory-cache');
const Sequelize = require('sequelize');
const utils = require("../public/utils");

const options = {
    'token': 'p4d0lfS9LR0aaHh0',           //填写你设定的Token
    'encodingaeskey': 'NfJU7O3k83Mr7KTP3gdHKIAyHKvRSBoAkWEO3cCvGjc',  //填写加密用的EncodingAESKey
    // 'appid': 'wx2e707ecbc65368f3',                  //填写高级调用功能的appid
    // 'appsecret': '092a7a30fb235d10edca16e91405f2f0'   //填写高级调用功能的密钥
    //'appid': 'wxe6209b6d5f2872a6',                  //测试号1
    //'appsecret': 'af758ed398ffe6395bfff0ff9b41ff56'   //测试号1
    'appid': 'wxf5ccc5ae787a2646',                  //测试号1
    'appsecret': 'e4668913444f591a062995c8b2c12d94'   //测试号1
};
module.exports = class WeixinService extends Service {
    // 获取access_token
    async getAccessToken() {
        // console.log(`调试:获取TOKEN的地方打印mpconfig`, this.ctx.mpconfig);
        const {id } =this.ctx.mpconfig;
        console.log(`调试:获取到公众号id`, id);
        console.log(`调试:从缓存中取access_token cache.get(${id}_access_token) = [${cache.get(`${id}_access_token`)}]`,)
        // return ;
        let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.ctx.mpconfig.appid}&secret=${this.ctx.mpconfig.appsecret}`;
        let access_token = '';
        // cache.del("access_token")
        if (!cache.get(`${id}_access_token`)) {
            console.log(`调试:缓存中不存在 重新获取`);
            access_token = await this.ctx.service.http.get({url}).then(res => {
                if (res.errcode) {
                    return Promise.reject({from: '获取TOKEN', result: res})
                } else {
                    let {access_token, expires_in} = res;
                    // console.log(`调试:开始写入缓存啊啊啊存储时间[${expires_in}]，[${typeof (expires_in)}]`, access_token);
                    cache.put(`${id}_access_token`, {access_token,mid:id, time: new Date(), expires_in: expires_in * 1000}, 7200000);
                    return Promise.resolve(res)
                }
            }).catch(err => {
                console.log(`调试:获取Token失败`, err)
                return Promise.reject({from: '获取TOKEN', result: err})

            });
            console.log(`调试:获取到access_token`, access_token);
        } else {
            console.log(`调试:缓存中存在直接拿`)
            let res = cache.get(`${id}_access_token`);
            res = await  this.checkAccessToken(res).catch(async err=>{
                    console.log(`调试:验证AccessToken失败 重新获取`,err);
                    return await this.getAccessToken();
            });

            let {access_token, time} = res
            // console.log(`调试:缓存中存在`, access_token);
            // console.log(`调试:存入时间`, time);
            // console.log(`调试:剩余时间`,7200 - (new Date().getTime() -  time.getTime())/ 1000);
            // res['residue'] = (7200 - (new Date().getTime() - time.getTime()) / 1000)
            return Promise.resolve(res)
        }

        return access_token


    }

    //创建二维码
    async qrcode({expire_seconds = 604800, scene_id = 1, type = 'json'} = {}) {
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
        };
        let result = await this.ctx.service.http.post({url, data});
        if (type === 'json') {
            return result
        } else {
            console.log(`调试:生成二维码成功 当前 是Buffer模式输出 `,)
            return qr.imageSync(result.url, {type: 'png'});
        }
    }

    //获取用户信息
    async getUserInfo({openid = ''}) {
        console.log(`获取用户信息weixin.getUserInfo:[${openid}]`)
        let {access_token} = await this.getAccessToken();
        // console.log(`调试获取用户信息:access_token[${access_token}]`);

        let url = `https://api.weixin.qq.com/cgi-bin/user/info?openid=${openid}&access_token=${access_token}&lang=zh_CN`;
        console.log(`调试:获取用户信息url[${url}]`);
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

    async createMenu({menu}={}) {
        let {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${access_token}`;
        /*
                 { "type": "view",  "name": "拼手气", "url": "http://www.soso.com/" }, //链接
                 {  "type": "miniprogram", "name": "wxa",  "url": "http://mp.weixin.qq.com", "appid": "wx286b93c14bbf93aa","pagepath": "pages/lunar/index"}, // 小程序
                 { "type": "click", "name": "赞一下我们", "key": "V1001_GOOD"} // 按钮
        * */
        let data = menu || {
            "button": [
                {
                    "type": "click",
                    "name": "使用教程",
                    "key": "SYJC"
                },
                {
                    "name": "一键红包",
                    "sub_button": [
                        {"type": "click", "name": "饿了么大礼包", "key": "DLB"},
                        {"type": "click", "name": "拼手气", "key": "PSQ"},
                        {"type": "click", "name": "品质联盟", "key": "PZLM"}
                    ]
                },
                {
                    "name": "个人中心",
                    "sub_button": [
                        {"type": "click", "name": "推广码", "key": "TGM"},
                        {"type": "click", "name": "每日签到", "key": "MRQD"},
                        {"type": "click", "name": "账户充值", "key": "ZHCZ"},
                        {"type": "click", "name": "余额查询", "key": "YECX"},
                        {"type": "click", "name": "联系客服", "key": "LXKF"},
                    ]
                }
            ]
        };
        console.log(`调试:构建菜单参数`, data)
        return await this.ctx.service.http.post({url, data})
    }

    // 添加客服
    async addServive(data) {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/customservice/kfaccount/add?access_token=${access_token}`
        data = {
            "kf_account": "admin@lianfangti",
            "nickname": "1号技师",
            "password": "123456"
        }
        return await this.ctx.service.http.post({url, data})
    }

    async getCustomService() {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/customservice/getkflist?access_token=${access_token}`
        return await this.ctx.service.http.get({url})
    }

    // 发送客服消息
    async sendServiceMessage({type = 'text', openid, content = '', head_content = "您对本次服务是否满意呢? ", articles = {}, tail_content = "欢迎再次光临", media_id = ''}) {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`;
        let data = {
            "touser": openid || this.ctx.request.body.FromUserName,
            "msgtype": `${type}`,
        };
        switch (type) {
            case "text":
                data[type] = {"content": `${content}`}
                break;
            case "image":
                data[type] = {media_id};
                break;

            case "video":
                data[type]={
                    media_id,
                    thumb_media_id:media_id,
                    title:'帮助视频',
                    description:'使用教程'
                }
            break;
            case "msgmenu":
                let list = [
                    {"id": "101", "content": "满意"},
                    {"id": "102", "content": "不满意"}
                ]
                data[type] = {
                    head_content,
                    tail_content,
                    list
                };
                break;
            case "news":
                /* articles 格式
                *   {
                            "title":"充值中心",
                            "description":"0.5元帮您领到最大红包实时充值实时到账",
                            "url":"http://eleme.lianfangti.cn/recharge",
                            "picurl":"https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/png/200x200-lk.png"
                        }
                * */
                data[type] = {
                    "articles": [articles]
                }
                break;

        }

        console.log(`\n\n *************[${new Date()}]客服消息发送日志 *************[ `);
        console.log(`\n发送数据:\n`, JSON.stringify(data), "\n\n");


        return await this.ctx.service.http.post({url, data}).then(res => {
            console.log(`调试:客服消息发送返回值`, res)
            if (res.errcode) {
                return Promise.reject(res);
            } else {
                return Promise.resolve(res);
            }
        }).catch(err => {
            console.log('错误:发送客服消息失败', err);
            return Promise.reject(err)
        })
    }

    //发送充值链接
    async sendRechargeLink(openid) {
        openid = openid || this.ctx.request.body.FromUserName;
        const articles = {
            "title": "充值中心",
            "description": "超值限时优惠套餐",
            "url": `http://eleme.lianfangti.cn/recharge?openid=${openid}&token=${this.ctx.mpconfig.token}`,
            "picurl": "https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/png/200x200-lk.png"
        };
        return await this.sendServiceMessage({type: 'news', articles});
    }

    // 发送模板消息
    async sendTemplateMessage(openid) {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`;
        let data = {
            "touser": `o-GhE5lF3AND63TVdilZMNlNbbNk`,
            "template_id": "Uo5zXHQk8kPhs-BjOSwaNU3I0R9YyV4lDFgZ6kHMU4w",
            "url": "http://weixin.qq.com/download",
            // "miniprogram":{ //点击打开小程序
            //     "appid":"xiaochengxuappid12345",
            //     "pagepath":"index?foo=bar"
            // },
            "data": {
                "first": {
                    "value": "发送成功",
                    "color": "#173177"
                },
                "keyword1": {
                    "value": '18757739042',
                    "color": "#173177"
                },
                "keyword2": {
                    "value": new Date(),
                    "color": "#173177"
                },
                "remark": {
                    "value": "请在30分钟内回复6位短信验证码 如果这不是您的手机号 您可重新发送手机号绑定",
                    "color": "#173177"
                }
            }
        };
        return await this.ctx.service.http.post({url, data})
    }

    // 新增素材
    async uploadMedia({type = 'image', media,perm = false}) {
        const {access_token} = await this.getAccessToken();
        console.log(`调试:获取到access_token`, access_token)
        const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${access_token}&type=${type}`;
        const url2 = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=${type}`
        let data = {
            media: {
                value: media,
                options: {
                    filename: `pic_${new Date().getTime()}.${{image:'.png',video:'.mp4'}[type]}`
                }
            },
            description:'{"title":"HELP_VIDEP", "introduction":"INTRODUCTION"}'
        };

        return await this.ctx.service.http.upload({url:perm ? url2 : url, data, json: true})
    }

    // 向用户发送正在输入中状态
    async typing() {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/custom/typing?access_token=${access_token}`;
        const openid = this.ctx.request.body.FromUserName;
        const data = {"touser": openid, "command": "Typing"};
        return await this.ctx.service.http.post({url, data})
    }

    // 用户回复
    async reply({type = 'text', content} = {}) {
        console.log(`\n\n 00000000000000000000000000000000[${new Date()}回复调用日志00000000000000000000000000000000\n]`);
        const {ctx} = this;
        const data = ctx.request.body;
        const head = `<xml><ToUserName><![CDATA[${data.FromUserName}]]></ToUserName> <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName> <CreateTime>${new Date().getTime()}</CreateTime> <MsgType><![CDATA[${type}]]></MsgType>`;
        let body;
        const end = `</xml>`;
        switch (type) {
            case 'text':
                body = `<Content><![CDATA[${content}]]></Content>`;
                break;
        }
        ctx.set("Content-Type", "text/xml");
        console.log(`调试:回复响应内容`, content ? `${head}${body}${end}` : 'success', "\n\n");
        ctx.body = content ? `${head}${body}${end}` : 'success'
        return true
    }

    async getMaterialList() {
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${access_token}`;
        console.log(`调试:获取素材列表api[${url}]`);
        const data = {
            "type":'video',
            "offset":0,
            "count":20
        }

       let result = await this.ctx.service.http.post({url,data});
        console.log(`调试:获取列表返回值`,result);
        return  result

    }

    async addMaterial({type = 'video',buffer}){
        const {access_token} = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=${type}`

    }

    async checkAccessToken(data){
        const {id } =this.ctx.mpconfig;
        const {access_token} =data;
        const url =`https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=${access_token}`;
        console.log(`调试:验证Token有效性`, access_token)
        return await  this.service.http.get({url}).then(res=>{
            if(res.errcode){
                console.log(`调试:Token[${access_token}]无效正在清除[${id}_access_token]`);
                cache.del(`${id}_access_token`); //清除Token
                return Promise.reject(res);
            }else{
                console.log(`调试:Token验证成功 原数据返回`, data)
                return  Promise.resolve(data)
            }
        })
    }

    //自动回复
    async autoReply({keyword}) {
        const mid = this.ctx.mpconfig.id;
        // let rules = await  this.ctx.model.ReplyRule.findOne({
        //     attributes:{exclude: []},
        //     where:{owner:mid}
        // })
        const sql = `rule_id = (SELECT rule_id FROM keywords WHERE rule_id in (SELECT id FROM reply_rule WHERE owner = ${mid}) AND keyword LIKE '%${keyword}%')`
        let replys = await this.ctx.model.Replys.findAll({
            attributes: {exclude: []},
            where: Sequelize.literal(sql)
        });

       let sql2 = `id = (SELECT rule_id FROM keywords WHERE rule_id IN (SELECT id FROM reply_rule WHERE OWNER = ${mid}) AND keyword LIKE '%${keyword}%')`
       let replyRules = await  this.ctx.model.ReplyRule.findOne({
           attributes: {exclude: []},
           where:Sequelize.literal(sql2)
       });
        // console.log(`调试:所属规则`, replyRules)
        // console.log(`调试:查询到的回复`, replys);
        console.log(`调试:搜索规则`, replyRules);
        if(!replyRules){
            let config  = await this.ctx.service.mpconfig.getAllConfig();
            return  [{type:1,content:config.auto_msg}];
        }
       if(replyRules.rule === 0){   //随机回复一条
           let random = utils.RandomNum(0,replys.length,"[)");
           console.log(`调试:随机回复一条`,random);
           return  [replys[random]];
       }else{
           console.log(`调试:全部回复`);
           return replys;        //全部回复
       }


        // SELECT * FROM replys  WHERE rule_id =  (SELECT rule_id FROM keywords WHERE rule_id in (SELECT id FROM reply_rule WHERE owner = 2) AND keyword LIKE '%教程%')

    }
}
