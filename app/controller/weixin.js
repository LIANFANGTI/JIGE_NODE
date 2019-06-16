const Controller = require("egg").Controller;
const crypto = require("crypto");
const requset = require('request-promise');
const qr = require('qr-image');
const utils  =require("../public/utils");



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
                            console.log(`调试:取关后更新用户状态返回值 `, result);
                        break;
                        case "CLICK":
                            await this.handleMenuClick(data);
                        break;
                        case "SCAN": //关注后扫码
                            let fid = data.EventKey;
                            // let fUser = await  ctx.service.user.exist({col:["nickname","id","times"],showCol:true,where:{id:fid}});
                            let iUser = await  ctx.service.user.exist({col:["id","times","father"],where:{openid},showCol:true});
                            let fUser = await  ctx.service.user.exist({col:["id","times","father","nickname"],where:{id:fid},showCol:true});
                            console.log(`调试:两个User的值`, fUser,"\n-----------",iUser)
                            if(iUser.father){
                                console.log(`调试:已经填写过邀请码`, iUser)
                                this.reply();
                            }else{
                                let res1 = await ctx.service.user.update({father:fid,times:fUser.times + 1 }, {openid});
                                let res2 = await ctx.service.user.update({father:fid,times:iUser.times + 1}, {id:fid});
                                if(res1 && res2) {
                                    this.reply({content:`邀请码填写成功 \n您的积分:+1,\n邀请者[${fUser.nickname}]积分:+1`});
                                }else{
                                    this.reply();
                                }
                            }



                        break;
                    }
                } catch (e) {
                    console.error(`调试:错误`, e)
                }

            } else if (data.MsgType) {
                const   content = data.Content,openid = data.FromUserName;
                 if(utils.checkPhone(content)){ // 判断是否为手机号
                     let phone = content;
                     console.log(`调试:收到的是手机号`, content);
                     let exist = await ctx.service.user.exist({where:{phone}});
                     if(exist){
                         this.reply({content: `号码[${phone}]已被绑定,请检查`});
                     }else{
                            // await   this.getEleme({phone});
                         let res =  await  ctx.service.user.update({phone},{openid});
                         if(res){
                             this.reply({content:'手机号绑定成功'});
                         }else{
                             this.reply({content:'手机号绑定失败'});

                         }
                     }

                 }else if(utils.checkVerificationCode(content)){  //判断是否为验证码
                     console.log(`调试:输入的为验证码`, content)
                     let res =  await this.getEleme({type:20,validate_code:content});

                 } else{
                     console.log(`调试:收到的不是手机号`, content);
                     this.reply({content: '恩恩好的呢'});
                 }

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
              this.reply();
              let res =  await this.getEleme({type:20});




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
        let query = ctx.request.query;
        let res = await ctx.service.weixin.qrcode({scene_id:query.fid || 1});
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
        let user = await this.ctx.service.user.exist({where:{openid},col:['phone','id',"times"],showCol:true}).catch(res=>{
            console.log(`调试:检测用户是否存在出错`, res)
        });
        if(user){ // 判断用户是否存在
            console.log(`调试:用户是否存在判断完毕`, user);
            console.log(`调试:判断用户是否存在手机号`, user.phone);
            let phone = user.phone
            if(user.phone ){
                console.log(`调试:用户已绑定手机号`);
                // this.reply({content});
                   console.log(`调试:开始调用ele接口`);
                let res = await  ctx.service.eleme.getEleme({phone});
                if(res.code == 1){
                    res.msg = `领取成功！！,请在饿了么中查看\n红包金额:满${res.result.sum_condition}减${res.result.amount}\n剩余积分:${user.times - 1} \n绑定账号: ${user.phone} `
                }
                console.log(`调试:Controller.weixin#182行`, res);
                await ctx.service.weixin.sendServiceMessage({content:res.msg});

            }else{
                this.reply({content:"您未绑定手机号 请回复11位手机号进行绑定"})

            }
        }else{
           return  ("用户不存在")

        }

    }

    async sendTemplateMessage(){
        this.ctx.body = await this.ctx.service.weixin.sendTemplateMessage();
    }

    async sendServiceMessage(){
        this.ctx.body = await  this.ctx.service.weixin.sendServiceMessage();
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

    reply({type = 'text', content} = {}) {
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
        ctx.body = content ?  `${head}${body}${end}` : 'success'

    }
};
