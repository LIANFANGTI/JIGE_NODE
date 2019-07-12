'use strict';
const Sequelize = require('sequelize');

const Controller = require('egg').Controller;
const {createCanvas, loadImage} = require('canvas');
class HomeController extends Controller {

  async index() {
    const { ctx } = this;
    try {
     let admin = await  this.ctx.service.mpconfig.checkAdminToken();
     let config = await  this.ctx.model.Mpconfig.findOne({
       attributes:["token","id"],
       where:{id:admin.mpid}
     })
      // console.log(`调试:获取到用户信息`, config)
      let res = await  this.ctx.service.mpconfig.checkToken(config.token);


    }catch (e) {
      console.log(`调试:`, e)
      this.ctx.body =e
    }
    let userCount =await this.ctx.model.User.findAll({
      // attributes:[Sequelize.literal("COUNT(1) as count")],
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      where:Sequelize.literal(`TO_DAYS(created_at) = TO_DAYS(NOW())`)
    });

    let getLog =await this.ctx.model.Log.findAll({
      // attributes:[Sequelize.literal("COUNT(1) as count")],
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      where:Sequelize.literal(`TO_DAYS(created_at) = TO_DAYS(NOW())`)
    });

    let rechargeCount = await  this.ctx.model.Recharge.findAll({
      // attributes:[Sequelize.literal("SUM(pay_price) as `sum`")],
      attributes: [[Sequelize.fn('SUM', Sequelize.col('pay_price')), 'sum']],
      where:Sequelize.literal(`TO_DAYS(created_at) = TO_DAYS(NOW())`)
    });
    let blance = await  this.ctx.service.mpconfig.getAllConfig();
    // console.log(`调试:查询结果`, rechargeCount)
    let data ={
      newuser:userCount[0].get('count'),
      recharge:Math.floor(rechargeCount[0].get('sum') * 100) / 100,
      getcount:getLog[0].get('count'),
      blance:blance.blance

    };
    ctx.body = {
      code:20000,
      data
    }
    // ctx.body = JSON.stringify({ code: 0, msg: 'Hello  Egg' });
  }


  //每日新用户统计
  async getNewUserLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
    const sql =`SELECT
                  DATE_FORMAT( created_at, '%Y-%m-%d' ) AS time,
                  DATE_FORMAT( created_at, '%w' ) AS weekday,
                  ABS( DateDiff( created_at, curdate( ) ) ) diffday,
                  count( * ) AS count 
                  FROM
                  users 
                  WHERE
                  ABS( DateDiff( created_at, curdate( ) ) ) <= 7 
                  GROUP BY
                  time`;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    result = result.map(item=>{
       item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday]
        return item;
    })
    this.ctx.body = {
      code:20000,
      data:result
    }
  }
  //每日充值统计
  async getRechargeLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
    const sql =`SELECT
                  DATE_FORMAT( created_at, '%Y-%m-%d' ) AS time,
                  DATE_FORMAT( created_at, '%w' ) AS weekday,
                  ABS( DateDiff( created_at, curdate( ) ) ) diffday,
                  SUM(pay_price) AS price 
                  FROM
                  recharge
                  WHERE
                  ABS( DateDiff( created_at, curdate( ) ) ) <7 
                  GROUP BY
                  time`;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    result = result.map(item=>{
      item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday]
      return item;
    })
    this.ctx.body = {
      code:20000,
      data:result
    }
  }
  //每日领取统计
  async getLogLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
    const sql =`SELECT
                DATE_FORMAT( created_at, '%Y-%m-%d' ) AS time,
                DATE_FORMAT( created_at, '%w' ) AS weekday,
                ABS( DateDiff( created_at, curdate( ) ) ) diffday,
                COUNT(1) AS count 
                FROM
                log
                WHERE
                ABS( DateDiff( created_at, curdate( ) ) ) <= 7 
                GROUP BY
                time
                `;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    result = result.map(item=>{
      item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday]
      return item;
    })
    this.ctx.body = {
      code:20000,
      data:result
    }
  }


  async getLineData({day= 7,table,cloumn='created_at',mode}){
  }

  async ktff(){
    this.ctx.set("Content-Type", "image/png");
    let  w = 414,   //画布宽度
        h = 553,   //画布高度
        x = 0,     //初始x偏移量
        y = 0,     //初始y偏移量
        hdw = 63,  //头像边长
        qrw = 174; //二维码边长

    let  text = await  this.ctx.service.http.get({url:"https://nmsl.shadiao.app/api.php"});
    console.log(`调试:`, text);
    // text= "HELLO"
    let line =  text.length / 13;
    let lineheight = 30;

    console.log(`调试:字数${text.length}计算行数`, line);
    let addheight = 0; //额外高度
    if(line > 4){
      addheight =  h += (line - 4) * lineheight
    }



    const canvas = createCanvas(w, h);
    const context = canvas.getContext('2d');
    context.fillStyle = "#FFFFFF";
    context.fillRect(0,0,w,400 + line);
    context.fillStyle="#000000";
    context.font = '23px Arial';
    let bgBuffer = await loadImage(`${this.config.baseDir}/app/public/images/mamalielie.png`); //本地图片
    context.drawImage(bgBuffer,0,0,400,400);




    for(let i =0; i < line;i++){
      let s= (13 * i);
      let e= (13 * i)+13 ;
      let t = text.substring(s,e);
      console.log(`调试:取出第${i+1}行文字从${s}到${e}取${e-s}个字`, t);
      context.fillText(t,50,300+(lineheight*i),300);
    }

    this.ctx.body = canvas.toBuffer();

  }
  async nmsl(){
    console.log(`调试:你访问了啊！`)
    await this.ctx.render("nmsl.html")

  }
  async sendNmslLink(){
    console.log(`调试:发送`);
    const articles = {
        "title": "口吐芬芳2.0内测版",
        "description": "一起来口吐芬芳 舌灿莲花 做一个儒雅随和的人",
        "url": `http://jige.lianfangti.cn/#/pages/nmsl/nmsl`,
        "picurl": "https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/png/nmsllogo.png"
    };
    await this.ctx.service.mpconfig.checkToken();

      this.ctx.body = await  this.ctx.service.weixin.sendServiceMessage({type:'news',articles,openid:'oUcAW5v08hJpsH49EUTIPJA_gCDo'});
  }

  async weixinFile(){
      this.ctx.body = `UzBeNXpZYRmW1N1n`
  }
  async weixinFile(){
    this.ctx.body = `UzBeNXpZYRmW1N1n`
  }

  async callback(){
    let {body,query} = this.ctx.request;

   console.log(new Date(),`调试:接收到红包领取回调`, {body,query});
   let { openid,jtoken } = query;
   try {
       await  this.ctx.service.mpconfig.checkToken(jtoken);
       let user = await  this.ctx.model.User.findOne({
           attributes:["id","times"],
           where:{openid}
       });

       let update = await  this.ctx.model.User.update({
           times:Sequelize.literal(`times - ${this.ctx.mpconfig.unit_coin}`)
       },{where:{id:user.id}});
       console.log(`调试:查询到用户信息`, user);
       let res = await this.ctx.model.Log.create({
           uid:user.id,
           type:'饿了么大礼包'
       })
       this.ctx.body={
           code:0,
           data:{body,query,res,update}
       }
       this.ctx.service.weixin.sendServiceMessage({content:`您已成功领取饿了么大礼包\n粮票使用:-${this.ctx.mpconfig.unit_coin}\n粮票余额:${user.times - this.ctx.mpconfig.unit_coin}`,openid})
   }catch (e) {
       this.ctx.body =e
   }
  }
}




module.exports = HomeController;
