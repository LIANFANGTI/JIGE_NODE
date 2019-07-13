const BaseController = require("./BaseController");
const crypto = require("crypto");
const utils = require("../public/utils");
const {createCanvas, loadImage} = require('canvas');
const Sequelize = require('sequelize');
const cache = require('memory-cache');

module.exports = class WeixinController extends BaseController {
    //微信授权
    async weixinAuth(){
        let {body,query} = this.ctx.request;
        this.ctx.body= {
            query,
            body
        }
    }


    async index() {
        const {ctx} = this;
        let query = ctx.request.query;
        // console.log(`调试:`, res)
        try {
            let mpconfig = await ctx.service.mpconfig.checkToken(query.token);
            // return  0;
            // console.log(`调试:ctx.mpconfig`, ctx.mpconfig);
            let data = ctx.request.body;
            console.log(`\n\n==================================[${new Date()}]接收到网络请求==================================`);
            this.ctx.logger.info("==================================接收到来自微信服务器的网络请求==================================");
            this.ctx.logger.info("GET参数:",query);
            this.ctx.logger.info("POST参数:",data);
            console.log(`调试:接收到的GET参数`, query);
            console.log(`调试:接收到的POST参数`, data);
            if (ctx.request.method === "POST") {
                if (data.Event) {
                    try {
                        let openid = data.FromUserName, exist;
                        switch (data.Event) {
                            case "subscribe":
                                await ctx.service.user.subscribe({openid});
                                break;
                            case "unsubscribe":
                                await ctx.service.user.unsubscribe({openid});
                                break;
                            case "CLICK":
                                await this.handleMenuClick({...data, openid});
                                break;
                            case "SCAN": //关注后扫码
                                let fid = data.EventKey;
                                // let fUser = await  ctx.service.user.exist({col:["nickname","id","times"],showCol:true,where:{id:fid}});
                                let iUser = await ctx.service.user.exist({
                                    col: ["id", "times", "father","nickname"],
                                    where: {openid},
                                    showCol: true
                                });
                                if (iUser.father) {
                                    console.log(`调试:已经填写过邀请码`, iUser)
                                    this.reply();
                                    return
                                }
                                let fUser = await ctx.service.user.exist({
                                    col: ["id", "times", "father", "nickname","openid"],
                                    where: {id: fid},
                                    showCol: true
                                });
                                console.log(`调试:两个User的值`, fUser, "\n-----------", iUser);

                                let res1 = await ctx.service.user.update({
                                    father: fid,
                                    times: iUser.times + 0
                                }, {openid});
                                let res2 = await ctx.service.user.update({
                                    father: fid,
                                    times: fUser.times + this.ctx.mpconfig.ex_coin
                                }, {id: fid});
                                let content = `邀请成功！🎉\n您成功邀请了${iUser.nickname}\n您的粮票:+${this.ctx.mpconfig.ex_coin}\n当前余额:${fUser.times + this.ctx.mpconfig.ex_coin}`;
                                this.ctx.service.weixin.sendServiceMessage({content,openid:fUser.openid});

                                if (res1 && res2) {
                                    this.reply({content: `邀请码填写成功 \n您的粮票:+${this.ctx.mpconfig.in_coin},\n邀请者[${fUser.nickname}]粮票:+${this.ctx.mpconfig.ex_coin}`});
                                } else {
                                    this.reply();
                                }


                                break;
                        }
                    } catch (e) {
                        ctx.logger.error(new Error(e));
                        console.error(`调试:错误`, e)
                    }

                } else if (data.MsgType) {
                    const content = data.Content, openid = data.FromUserName;
                    if (utils.checkPhone(content)) { // 判断是否为手机号
                        let phone = content;
                        console.log(`调试:收到的是手机号`, content);
                        let exist = await ctx.service.user.exist({where: {phone,mid:this.ctx.mpconfig.id}});
                        console.log(`调试where:`, {phone,mid:this.ctx.mpconfig.id});
                        if (exist) {
                            this.reply({content: `号码[${phone}]已被绑定,请检查`});
                        } else {
                            // await   this.getEleme({phone});
                            let res = await ctx.service.user.update({phone}, {openid});
                            if (res) {
                                this.reply({content: '手机号绑定成功'});
                            } else {
                                this.reply({content: '手机号绑定失败'});

                            }
                        }

                    } else if (utils.checkVerificationCode(content)) {  //判断是否为验证码
                        console.log(`调试:输入的为验证码`, content);
                        this.reply();
                        let res = await this.getEleme({type: 20, validate_code: content});
                        console.log(`调试:提交验证码返回值`, res)

                    } else {
                        console.log(`调试:收到的不是手机号`, content);
                        this.reply({});
                        this.ctx.runInBackground(async()=>{
                            let replys = await  this.ctx.service.weixin.autoReply({keyword:content});
                            // console.log(`调试:自动回复`, reply);
                            for(let reply of replys){
                                this.ctx.service.weixin.sendServiceMessage({content:reply.content})
                            }
                        });
                        this.ctx.runInBackground(async()=>{
                            let result = await  this.ctx.service.user.getCodeCoin({keyword:content,openid});
                        })

                        // this.reply({content: '恩恩好的呢'});
                    }

                }
            } else {
                let array = [query.token, query.timestamp, query.nonce];
                let key = array.sort().join("");
                // console.log(`调试:key=[${key}]`, array)
                let sha1 = crypto.createHash("sha1").update(key).digest("hex");

                if (sha1 == query.signature) {
                    ctx.body = query.echostr
                } else {
                    ctx.body = "Token 验证出错"
                }
            }
        } catch (e) {
            console.log(`错误:`, e);
            ctx.logger.error(new Error(e));
            ctx.body = e;
        }


    }

    //菜单点击事件
    async handleMenuClick({EventKey, openid}) {
        try {
            console.log(`调试:响应点击事件[${EventKey}](${openid})`);
            // let data = this.ctx.request.body;
            // let openid = data.FromUserName;
            // let openid = this.ctx.request.body.FromUserName;
            switch (EventKey) {
                case "SYJC": // 使用教程
                    let allConfig = await  this.ctx.service.mpconfig.getAllConfig()
                    let content = allConfig.help_message || `如何使用XX红包助手？\n 1.回复手机号 \n 2.点击菜单栏一键红包 \n 3.回复验证码即可领取`;
                    this.reply({content});
                    // this.service.weixin.sendServiceMessage({type:'video',media_id:'_mk7AF04X-VAzkJcPZDscYwCchj86MrVd9zOnzXco70'});
                break;
                case "PSQ":  // 拼手气红包

                    // this.reply({content: '你点击了拼手气红包'});
                    await this.getEleme({type: 20,openid});
                break;
                case "PZLM": // 品质联盟
                    console.log(`调试:你点击了品质联盟`)
                    await this.getEleme({type: 21,openid});

                break;
                case "DLB":
                    await this.getEleme({type: 23,openid});
                break;
                case "TGM":  // 推广码
                    this.reply({content: '获取中 请稍后...'});
                    this.ctx.runInBackground(async ()=>{
                        let u = await this.ctx.service.user.findOne({col: ["id", "openid"], where: {openid}});
                        console.log(`调试:用户信息`, u.id);
                        const url = `http://127.0.0.1:7003/draw?type=image&id=${u.id}&token=${this.ctx.mpconfig.token}`;
                        let buffer = await this.ctx.service.http.download({url});
                        console.log(`调试:数据下载成功`, buffer);
                        this.ctx.service.weixin.uploadMedia({type: 'image', media: buffer}).then(async res => {
                            console.log(`调试:上传到微信服务器返回值`, res);
                            let {media_id} = res;
                            console.log(`调试:返回的媒体ID`, media_id, typeof (res));
                            await this.ctx.service.weixin.sendServiceMessage({content: `推广码获取成功 \n请点击查看原图 长按发送给朋友\n成功邀请一位朋友您将获得${this.ctx.mpconfig.ex_coin}粮票`});
                            await this.ctx.service.weixin.sendServiceMessage({media_id, type: 'image'});
                        })
                    });
                    break;
                case "MRQD": // 每日签到
                    this.reply({content: '签到中请稍后...'});
                    this.ctx.runInBackground(async()=>{
                       await this.ctx.service.user.signin({openid});
                    });
                break;
                case "ZHCZ": // 账户充值
                    this.reply();
                    this.ctx.service.weixin.typing();
                    this.ctx.service.weixin.sendRechargeLink();


                    break;
                case "YECX": // 余额查询

                    let user = await this.ctx.service.user.findOne({col: ["id", "times"], where: {openid}});
                    console.log(`调试:余额查询返回用户对象`, user);
                    this.reply({content: `查询成功 \n剩余粮票:${user.times}\n您可通过邀请 充值 或 每日签到来获取粮票！`});

                    break;
                case "LXKF": //联系客服
                    this.reply({content: `复制搜索下方微信号 或长按识别下方二维码联系客服微信`});
                    // return  0;

                    this.ctx.runInBackground(async ()=>{
                        await this.ctx.service.mpconfig.checkToken();
                        let {  service_qr,weixin } = await this.ctx.service.mpconfig.getAllConfig(); // 获取二维码文件地址
                        await  this.ctx.service.weixin.sendServiceMessage({content:`${weixin}`});

                        let serviceQrBuffer =await this.ctx.service.http.download({url:service_qr});
                        console.log(`调试:获取到的文件buffer`, serviceQrBuffer);

                        let { media_id } = await this.ctx.service.weixin.uploadMedia({media:serviceQrBuffer});

                        await  this.ctx.service.weixin.sendServiceMessage({type:'image',media_id});
                    })

                    // console.log(`调试:上传到微信返回值`, res);





                    break;
                case "NEWS":
                    await this.ctx.service.weixin.sendServiceMessage({type: 'news'})
                case "TYPING":
                    this.ctx.body = await this.ctx.service.weixin.typing()
                    break;
                case "ACCESS_TOKEN":
                    this.ctx.body = await this.ctx.service.weixin.getAccessToken();
                    break;
                case "BUILD_MENU":
                    this.ctx.body = await this.ctx.service.mpconfig.buildMenu();
                break;
                case "MATERIALLIST":
                    this.ctx.service.mpconfig.checkToken();

                    // return 0
                    this.ctx.body = await  this.ctx.service.weixin.getMaterialList();
                break;
                case "ADDMATERIAL":
                    this.ctx.service.mpconfig.checkToken();
                    let videoBuffer =  await  this.ctx.service.http.download({url:'https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/video/help.mp4'})

                    // return 0
                    this.ctx.body = await  this.ctx.service.weixin.uploadMedia({
                        media:videoBuffer,
                        type:'video',
                        perm:true
                    });
                 break;
            }
        } catch (e) {
            // console.error(`错误:`, e);
            this.ctx.logger.error(new Error(e));
            this.ctx.body = e
        }

    }


    async menu() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            this.ctx.body = await this.ctx.service.weixin.getMenu();
        }catch (e) {
            this.ctx.logger.error(new Error(e));
            this.ctx.body =e
        }
    }

    async createMenu() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            this.ctx.body = await this.ctx.service.weixin.createMenu();
        }catch (e) {
            console.error(`错误:创建菜单出错`, e)
            this.ctx.logger.error(new Error(e));
            this.ctx.body =e
        }
    }


    //生成二维码
    async qr() {
        const {ctx} = this;
        let query = ctx.request.query;
        let type = query.type || 'json';
        let res = await ctx.service.weixin.qrcode({scene_id: query.fid || 1, type});
        console.log(`调试:获取二维码内容`, res)

        if (type == 'image') {
            ctx.set("Content-Type", "image/png");
            ctx.body = res
        } else {
            ctx.body = res
        }
    }

    //推广码测试
    async draw() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            let rules = {
                id: [
                    {required: true}
                ]
            }
            try {
                let query = await this.validate({rules, type: "GET"});
                let exist = await this.ctx.service.user.exist({where: {id: query.id}});
                if (!exist) {
                    this.ctx.status = 404;
                    this.ctx.body = {
                        code: 404,
                        msg: '数据不存在'
                    }
                } else {
                    await this.drawExtensionCode(query);
                }
                console.log(`调试:参数验证结果`, query)
            } catch (e) {
                this.ctx.logger.error(new Error(e));
                console.log(`调试:出错`, e)
            }
        } catch (e) {
            this.ctx.logger.error(new Error(e));
            this.ctx.body = e
        }

    }

    // 绘制推广码
    async drawExtensionCode({id}) {
        const {ctx} = this;
        let query = ctx.request.query;
        let {headimgurl} = await ctx.service.user.findOne({col: ['nickname', 'headimgurl', 'id'], where: {id}});
        console.log(`调试:获取到用户信息`, {headimgurl, id});
        let qrCodeBuffer = await ctx.service.weixin.qrcode({scene_id: id || 1, type: 'image'});
        let hdBuffer = await loadImage(headimgurl); //网络图片
        let bgBuffer = await loadImage(`${this.config.baseDir}/app/public/images/hongbao.png`); //本地图片
        let qrBuffer = await loadImage(qrCodeBuffer); // Buffer 数据

        this.ctx.set("Content-Type", "image/png");
        this.ctx.body = await this.drawImage({bgBuffer, hdBuffer, qrBuffer})
    }

    // 绘制图形
    async drawImage({bgBuffer, hdBuffer, qrBuffer}) {
        console.log(`调试:绘制`, {bgBuffer, hdBuffer, qrBuffer})
        const w = 414,   //画布宽度
            h = 553,   //画布高度
            x = 0,     //初始x偏移量
            y = 0,     //初始y偏移量
            hdw = 63,  //头像边长
            qrw = 174; //二维码边长
        const canvas = createCanvas(w, h);
        const context = canvas.getContext('2d');
        context.drawImage(hdBuffer, w / 2 - (hdw / 2), 185, hdw, hdw);  //绘制头像
        context.drawImage(bgBuffer, x, y, w, h);                                 //绘制背景
        context.drawImage(qrBuffer, w / 2 - (qrw / 2), 298, qrw, qrw);   //绘制二维码
        return canvas.toBuffer();
    }
// 临时接口
  async getEleme2({openid,validate_code}){
        this.reply();
        try {
            let res = await  this.ctx.service.http.post({
                url:`http://eom.mmqbb.cn:8083/elmdhb/getUrl`,
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                },
                formData:{
                    xttoken:"jigezhushou",
                    openid
                }
            });



        }catch (e) {

        }

  }

    //领红包
    async getEleme({type = 20, validate_code,openid}) {
        this.reply();
        if(type === 23){
            try {
                let user = await this.ctx.service.user.exist({
                    where: {openid},
                    col: ['phone', 'id', "times"],
                    showCol: true
                });
                if (user.times < 9) {
                    this.reply({content: '领取失败😢\n余额不足快去邀请好友 或充值吧😗'});
                    return;
                }
                if(!user.phone){
                    this.ctx.service.weixin.sendServiceMessage({content:'请先回复手机号绑定'});
                    return ;
                }
                let { url } = await  this.ctx.service.eleme.getHongbaoUrl({openid});
                console.log(`调试:获取红包URL成功`, url);
                const articles = {
                    "title": "饿了么大礼包",
                    "description": "",
                    url:`${url}&phone=${user.phone}`,
                    "picurl": "https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/png/%E7%BA%A2%E5%8C%85.png"
                };

                this.ctx.service.weixin.sendServiceMessage({type:'news',articles});
            }catch (e) {
                console.log(`调试:临时红包出错`, e);
                this.ctx.body = e
            }
            return 0;
        }






        // return 0;
        const {ctx} = this;
        const data = ctx.request.body;
        // const openid = data.FromUserName;
        console.log(`调试:开始检测用户是否存在 `);
        let user = await this.ctx.service.user.exist({
            where: {openid},
            col: ['phone', 'id', "times"],
            showCol: true
        });
        if (user.times < 9) {
            this.reply({content: '领取失败😢\n余额不足快去邀请好友 或充值吧😗'});
            return;
        }
        if (user) { // 判断用户是否存在
            console.log(`调试:用户是否存在判断完毕`, user);
            console.log(`调试:判断用户是否存在手机号`, user.phone);
            let phone = user.phone
            if (user.phone) {
                console.log(`调试:用户已绑定手机号`);
                // this.reply({content});
                console.log(`调试:开始调用ele接口`);
                this.reply({content: '数据获取中...请稍后\n ⚠️切勿重复点击！'});
                await ctx.service.weixin.typing();
                try {
                    ctx.service.eleme.getEleme(validate_code ? {phone, validate_code, type} : {
                        phone,
                        type
                    }).then(async res => {
                        this.ctx.logger.info("调用ELEME接口返回值",res);
                        console.log(`调试:调用Eleme接口返回值`, res);
                        if (res.code === 1) {
                            await ctx.service.user.update({times: user.times - ctx.mpconfig.unit_coin}, {openid});
                            console.log(`调试:领取成功商户余额 -￥${this.ctx.mpconfig.unit_price}`);
                            await ctx.service.mpconfig.update({blance: Sequelize.literal(`blance - unit_price`)},{id:this.ctx.mpconfig.id});//减去账户余额测试
                            let log = {
                                uid: user.id,
                                times: user.times - this.ctx.mpconfig.unit_coin,
                                ...res.result
                            }
                            res.msg = `领取成功！！😄\n请在饿了么中查看\n红包类型:${type === 20 ? '拼手气' : '品质联盟'}\n红包金额:满${res.result.sum_condition}减${res.result.amount}\n粮票使用: -${ctx.mpconfig.unit_coin}\n剩余粮票:${user.times - ctx.mpconfig.unit_coin} \n绑定账号: ${user.phone} `

                            ctx.service.logs.add(log) //领红包日志表中插入数据
                        }


                        // console.log(`调试:Controller.weixin#182行`, res);
                        ctx.service.weixin.sendServiceMessage({content: res.msg});


                    });

                } catch (e) {
                    this.ctx.logger.error(new Error(e));
                    console.log(`调试:Eleme接口调用出错`, e)
                }


            } else {
                this.reply({content: "您未绑定手机号 请回复11位手机号进行绑定"})

            }
        } else {
            return ("用户不存在")

        }

    }

    // 日志测试

    async log() {
        let log = {
            uid: 1,
            sn: '',
            balance: 94.7891,
            message: '成功',
            amount: '5',
            type: '品质联盟专享红包',
            sum_condition: '30',
            token: '111111',
        }
        this.ctx.body = await this.ctx.service.logs.add(log);
    }

    async pay() {
        try {
            await  this.ctx.service.mpconfig.checkToken();
            const md5 = crypto.createHash('md5');
            const url = `https://xorpay.com/api/cashier/4472`;
            const apps = 'fccd1864af5b43c99784d36855aa9f3d';
            const rules = {
                price: [{required: true}],
                uid: [{required: true}],
                name: [{required: true}],
                openid: [{required: true}],

            }
            let body = await this.validate({rules, type: "POST"});
            let data = {
                name: body.name,
                pay_type: 'jsapi',
                price: body.price,
                order_id: `CZ${body.uid}${new Date().getTime()}`,
                order_uid: body.uid,
                notify_url: `http://eleme.lianfangti.cn/pay_callback?token=${this.ctx.mpconfig.token}`,
                cancel_url: `http://eleme.lianfangti.cn/recharge?token=${this.ctx.mpconfig.token}&openid=${body.openid}`,
                more: body.name,
                expire: 1300,
            };
            let {order_id, price, more, name} = data;
            // let order
            // console.log(`调试:摘取的订单 信息`, order);
            let orders = await this.ctx.service.orders.add({
                ...{order_id, price, more, name},
                coin: body.coin,
                status: 0,
                buyer: data.order_uid

            });

            let str = `${data.name}${data.pay_type}${data.price}${data.order_id}${data.notify_url}${apps}`;
            console.log(`调试:拼接的字符串`, str);
            data['sign'] = md5.update(str).digest('hex').toUpperCase();
            // this.ctx.body= data
            console.log(`调试:最终发送的数据`, data);
            this.ctx.body = {
                code: 0,
                result: `${url}${utils.encodeParams(data)}`
            }
        } catch (e) {
            console.log(`调试:出错`, e)
            this.ctx.body = e
        }

    }

    async payCallback() {
        try {
            await this.ctx.service.mpconfig.checkToken();
            let query = this.ctx.request.query
            let data = this.ctx.request.body;

            this.ctx.logger.info(`==================================支付回调==================================`,);
            this.ctx.logger.info(`GET参数`,query);
            this.ctx.logger.info(`POST参数`,data);

            let {order_id} = data;
            let status = await  this.ctx.service.orders.getOrderStatus(order_id);
            console.log(`调试:获取到的订单状态[${typeof(status)}]`, status)
            if(status !== "0"){
                console.log(`调试:该订单状态已经更新过`,status);
                this.ctx.status = 300
                this.ctx.body = {
                    code:0,
                    msg:"该订单已经更新过状态"
                }
                return ;
            }
            let {detail} = data;
            detail = detail.replace(/'/g, "");
            console.log(`调试:detail`, detail);

            // more = JSON.parse(more);
            // console.log(`调试:more`, more);
            detail = JSON.parse(detail);
            data["status"] = 1;
            data = Object.assign(data, detail);
            delete data["detail"];
            delete data["sign"];
            delete data['buyer'];

            console.log(`调试:处理后的data`, data)
            let result = await this.ctx.service.orders.update(data, {order_id});
            let order = await this.ctx.service.orders.findOne({col: ['buyer', "order_id", 'coin'], where: {order_id}});
            await this.ctx.service.user.update({times: Sequelize.literal(`times + ${order.coin}`)}, {id: order.buyer});
            let user = await this.ctx.service.user.findOne({col: ['id', "openid", 'times'], where: {id: order.buyer}});

            let content = `充值成功!😄\n订单编号:${order.order_id}\n充值粮票:${order.coin}\n当前余额:${user.times}\n`;
            await this.ctx.service.weixin.sendServiceMessage({content, openid: user.openid});
            console.log(`调试:数据库更新返回值`, result);
            this.ctx.body = "success"
        }catch (e) {
            this.ctx.logger.error(new Error(e));
            this.ctx.body = e
        }
    }

    //充值
    async recharge() {
        try {
            // const rules ={openid:[{required:true}]}
            await  this.ctx.service.mpconfig.checkToken();
            const {openid} = this.ctx.request.query;
            let user;
            // const  = query
            if (!openid) {
                this.ctx.body = {
                    error: 404,
                    msg: "无效链接"
                }
                return 0
            } else {
                user = await this.ctx.service.user.exist({showCol: true, where: {openid}});
                if (!user) {
                    this.ctx.body = {
                        error: 403,
                        msg: "无效参数"
                    }
                    return;
                }
                console.log(`调试:获取到用户信息`, user)
            }
            let pidsql = `pid = (SELECT recharge_plan FROM  mpconfig WHERE id = ${this.ctx.mpconfig.id})`;
            let items = await  this.ctx.model.RechargePlan.findAll({
                attributes:["name","price","pay_price","coin","pid"],
                where:Sequelize.literal(pidsql)
            });
            let { recharge_msg } = await  this.service.mpconfig.getAllConfig();
            const data = {
                recharge_msg: recharge_msg || '',
                openid,
                token:this.ctx.mpconfig.token,
                uid: user.id,
                items: items || [
                    {name: '10粮票', price: 0.6, coin: 10},
                    {name: '50粮票', price: 2.8, coin: 50},
                    {name: '100粮票', price: 5.00, coin: 100},
                    {name: '150粮票', price: 6.5, coin: 150},
                    {name: '200粮票', price: 9.00, coin: 91},
                    {name: '10测试粮票', price: 0.01, coin: 10}
                ]
            }
            await this.ctx.render("recharge.html", data)
        } catch (e) {
            this.ctx.logger.error(new Error(e));
            this.ctx.body = e
        }
    }

    async sendTemplateMessage() {
        this.ctx.body = await this.ctx.service.weixin.sendTemplateMessage();
    }

    async sendServiceMessage() {
        let data = this.ctx.request.body;
        let admin = await this.ctx.service.mpconfig.checkAdminToken();
        console.log(`调试:接收到数据`, data);
        if(data.coin > 0){
            console.log(`调试:需要赠送金币`, data.coin);
            // console.log(`调试:赠送者`, admin.id);
           await this.ctx.service.user.giveCoin({giver:admin.id,...data});
        }

        await  this.ctx.service.weixin.sendServiceMessage({openid:data.openid,content:data.message});

        this.ctx.body = {
            code:20000,
            data,
            message:'发送成功'
        }


        // this.ctx.body = await this.ctx.service.weixin.sendServiceMessage();
    }


    //获取access_token
    async getAccessToken() {
        const {ctx} = this;
        ctx.body = await ctx.service.jige.getAccessToken();
    }

    //添加客服
    async addSerivce() {
        const {ctx} = this;
        ctx.body = await ctx.service.weixin.addServive()

    }

    async getCustomService() {
        const {ctx} = this
        ctx.body = await ctx.service.weixin.getCustomService();
    }

    async setAccessToken(){
         this.ctx.body = cache.put('2_access_token',{access_token: '12345677777',time:new Date().getTime()});
    }

    reply({type = 'text', content} = {}) {
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

    }


};
