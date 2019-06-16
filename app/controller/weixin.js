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
                try {
                    let openid = data.FromUserName, exist;
                    switch (data.Event) {
                        case "subscribe":
                            let userinfo = await ctx.service.weixin.getUserInfo({openid});
                            console.log(`调试:用户信息userinfo返回值`, userinfo)
                            let father = data.EventKey.split('_')[1]
                            exist = await ctx.service.user.exist({where: {openid}});
                            let user = {...userinfo};
                            if (!exist) {
                                user['times'] = 2; // 新用户送两个次数
                                user['father'] = father; // 新用户送两个次数
                                user['subscribe'] = 1; // 是否关注
                                let addResult = await ctx.service.user.add(user);
                                // console.log(`调试:添加用户返回值`, addResult);
                            } else {
                                user['subscribe'] = 1; // 是否关注
                                let updateResult = await ctx.service.user.update(user, {openid})
                                console.log(`调试:用户已存在 信息更新成功`, updateResult)
                            }

                            this.reply({content: '谢谢关注 ！NM$L! 💖'});
                            break;
                        case "unsubscribe":
                            let result = await ctx.service.user.update({subscribe: 0}, {openid})
                            console.log(`调试:取关后更新用户状态返回值 `, result)
                        break;
                        case "CLICK":
                            await this.handleMenuClick(data);
                        break;
                    }
                } catch (e) {
                    console.error(`调试:错误`, e)
                }

            } else if (data.MsgType) {
                this.reply({content: '恩恩好的呢'});
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

    //菜单点击事件
    async handleMenuClick({EventKey}){
        console.log(`调试:响应点击事件[${EventKey}]`);
        switch (EventKey) {
            case "SYJC": // 使用教程
                let content = `如何使用XX红包助手？\n 1.回复手机号 \n 2.点击菜单栏一键红包 \n 3.回复验证码即可领取`;
                this.reply({content})
            break;
            case "PSQ":  // 拼手气红包

                this.reply({content:'你点击了拼手气红包'});
                break;
            case "PZLM": // 品质联盟

              let res =  await this.getEleme({type:20});

              // this.reply({content:res});


           break;
            case "TGM":  // 推广码
                this.reply({content:'你点击了推广码按钮'});

            break;
            case "MRQD": // 每日签到
                this.reply({content:'你点击了每日签到按钮'});
                break;
            case "ZHCZ": // 账户充值
                this.reply({content:'你点击了账户充值按钮'});


                break;
            case "YECX": // 余额查询
                this.reply({content:'你点击了余额查询按钮'});

                break;
            case "LXKF": //联系客服
                this.reply({content:'你点击了联系客服按钮'});

            break;
        }
    }



    async menu(){
        this.ctx.body = await this.ctx.service.weixin.getMenu();
    }
    async createMenu(){
        this.ctx.body =  await this.ctx.service.weixin.createMenu()
    }


    //生成二维码
    async qr() {
        const {ctx} = this;
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

    //领红包
    async getEleme({type=20}){
        const {ctx} = this;
        const data = ctx.request.body;
        const openid = data.FromUserName;
        console.log(`调试:开始检测用户是否存在 `)
        let user = await this.ctx.service.user.exist({where:{openid},col:['phone','id'],showCol:true}).catch(res=>{
            console.log(`调试:检测用户是否存在出错`, res)
        });
        if(user){ // 判断用户是否存在
            console.log(`调试:用户是否存在判断完毕`, user);
            console.log(`调试:判断用户是否存在手机号`, user.phone);
            if(user.phone){
                console.log(`调试:用户已绑定手机号`);
                ctx.body = "ok"
                this.reply({content:"领取成功"})
              }else{
                this.reply({content:"您未绑定手机号 请回复11位手机号进行绑定"})

            }
        }else{
           return  ("用户不存在")

        }

    }


    //获取access_token
    async getAccessToken() {
        const {ctx} = this;
        ctx.body = await ctx.service.weixin.getAccessToken();
    }

    //添加客服
    async addSerivce(){
        const {ctx} = this;
        ctx.body = await  ctx.service.weixin.addServive()

    }

    async getCustomService(){
        const { ctx } = this
        ctx.body  = await  ctx.service.weixin.getCustomService();
    }

    reply({type = 'text', content = ''}) {
        console.log(`调试:调用了回复`, content)
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
        console.log(`调试:即将响应的内容`, `${head}${body}${end}`)
        ctx.body = `${head}${body}${end}`

    }
};
