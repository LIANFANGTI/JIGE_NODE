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


  //获取领取记录
  async getLogList(){
      this.mysql = new Sequelize(this.config.sequelize);
      let query = this.ctx.request.query;
      let {size,page,condition} = query;
      condition = JSON.parse(condition);
      let {word,type,range = 'all'} = condition;
      console.log(`调试:查询参数`, word,range);
      let dateRange = {
          all:'true',
          day:'ABS( DateDiff( log.created_at, curdate( ) ) ) <1 ',
          week:'ABS( DateDiff( log.created_at, curdate( ) ) ) <7',
          month:'ABS( DateDiff( log.created_at, curdate( ) ) ) <30',

      }
      const countSQL = `SELECT count(1) as total FROM log JOIN users ON log.uid = users.id   WHERE (nickname like '%${word}%' OR phone like '%${word}%') AND type  like '%${type}%' AND  ${dateRange[range]} `;
      const sql =` SELECT users.nickname,users.phone,log.type,log.times,log.sum_condition,log.amount,log.created_at FROM log JOIN users ON log.uid = users.id 
                        WHERE (nickname like '%${word}%' OR phone like '%${word}%') AND type  like '%${type}%' AND  ${dateRange[range]}   
                        ORDER BY log.created_at desc limit ${size * (page - 1)},${size}`;
      let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
      let total =  await this.mysql.query(countSQL,{ type: this.mysql.QueryTypes.SELECT});
      console.log(`调试:总条数统计`, total)
      this.ctx.body = {
          code:20000,
          data:{
              total:total[0]['total'],

              results:result
          }
      }
  }

    //积分赠送记录
    async getGiveLogList(){
        this.mysql = new Sequelize(this.config.sequelize);
        let query = this.ctx.request.query;
        let {size,page,condition} = query;
        condition = JSON.parse(condition);
        let {word,type,range = 'all'} = condition;
        console.log(`调试:查询参数`, word,range);
        let dateRange = {
            all:'true',
            day:'ABS( DateDiff( log.created_at, curdate( ) ) ) <1 ',
            week:'ABS( DateDiff( log.created_at, curdate( ) ) ) <7',
            month:'ABS( DateDiff( log.created_at, curdate( ) ) ) <30',

        }
        const countSQL = `SELECT count(1) as total FROM give_log as log JOIN users ON log.openid = users.openid   WHERE (nickname like '%${word}%' OR phone like '%${word}%') AND type  = ${type ==='all' ? `type` : type } AND  ${dateRange[range]} `;
        const sql =` SELECT users.nickname,users.phone,log.type,log.message,log.coin,log.remark,log.created_at FROM give_log as log JOIN users ON log.openid = users.openid 
                        WHERE (nickname like '%${word}%' OR phone like '%${word}%') AND type  = ${type ==='all' ? `type` : type } AND  ${dateRange[range]}   
                        ORDER BY log.created_at desc limit ${size * (page - 1)},${size}`;
        let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
        let total =  await this.mysql.query(countSQL,{ type: this.mysql.QueryTypes.SELECT});
        console.log(`调试:总条数统计`, total)
        this.ctx.body = {
            code:20000,
            data:{
                total:total[0]['total'],

                results:result
            }
        }
    }
    //网络请求记录日志
    async getRequestLogList(){
        this.mysql = new Sequelize(this.config.sequelize);
        let query = this.ctx.request.query;
        let {size,page,condition} = query;

        condition = JSON.parse(condition);
        let {word,method='all',range = 'all'} = condition;
        console.log(`调试:查询参数`, word,range);
        let dateRange = {
            all:'true',
            day:'ABS( DateDiff( log.created_at, curdate( ) ) ) <1 ',
            week:'ABS( DateDiff( log.created_at, curdate( ) ) ) <7',
            month:'ABS( DateDiff( log.created_at, curdate( ) ) ) <30',

        }
        const countSQL = `SELECT count(1) as total FROM request_log as log
                          WHERE (url like '%${word}%' OR body like '%${word}%' OR  data like '%${word}%' OR  query like '%${word}%' ) AND method  = ${method ==='all' ? `method` : method } AND  ${dateRange[range]} `;

        const sql =`SELECT url,method,status,query,data,body,take_time,created_at FROM request_log as log
                    WHERE (url like '%${word}%' OR body like '%${word}%' OR  data like '%${word}%' OR  query like '%${word}%' ) AND method  = ${method ==='all' ? `method` : method } AND  ${dateRange[range]} 
                    ORDER BY log.created_at desc limit ${size * (page - 1)},${size}`;
        let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
        let total =  await this.mysql.query(countSQL,{ type: this.mysql.QueryTypes.SELECT});
        console.log(`调试:总条数统计`, total);
        this.ctx.body = {
            code:20000,
            data:{
                total:total[0]['total'],

                results:result
            }
        }
    }

  //每日新用户统计
  async getNewUserLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
      const sql =`SELECT days,IFNULL(count,0) count FROM 
                (SELECT DATE_ADD( (@cdate := DATE_ADD(@cdate,INTERVAL  - 1 day)),INTERVAL 1 day) days from (SELECT @cdate := CURDATE() from recharge limit 7) t1 ) as t
                LEFT JOIN 
                (SELECT  DATE_FORMAT( created_at, '%Y-%m-%d' )  AS time,COUNT(1) as count   FROM users  GROUP BY time   ORDER BY count DESC) d
                ON d.time = t.days   ORDER BY days
                 `;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    // result = result.map(item=>{
    //    item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday]
    //     return item;
    // })
    this.ctx.body = {
      code:20000,
      data:result
    }
  }
  //每日充值统计
  async getRechargeLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
    const sql =`SELECT days,IFNULL(count,0) count FROM 
                (SELECT DATE_ADD( (@cdate := DATE_ADD(@cdate,INTERVAL  - 1 day)),INTERVAL 1 day) days from (SELECT @cdate := CURDATE() from recharge limit 7) t1 ) as t
                LEFT JOIN 
                (SELECT  DATE_FORMAT( created_at, '%Y-%m-%d' )  AS time,SUM(pay_price) as count   FROM recharge  GROUP BY time   ORDER BY count DESC) d
                ON d.time = t.days   ORDER BY days
                 `;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    // result = result.map(item=>{
    //   // item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday];
    //   return item;
    // });
    this.ctx.body = {
      code:20000,
      data:result
    }
  }
  //每日领取统计
  async getLogLineCount(){
    this.mysql = new Sequelize(this.config.sequelize);
      const sql =`SELECT * FROM 
                (SELECT DATE_ADD( (@cdate := DATE_ADD(@cdate,INTERVAL  - 1 day)),INTERVAL 1 day) days from (SELECT @cdate := CURDATE() from recharge limit 7) t1 ) as t
                LEFT JOIN 
                (SELECT  DATE_FORMAT( created_at, '%Y-%m-%d' )  AS time,COUNT(1) as count   FROM log  GROUP BY time   ORDER BY count DESC) d
                ON d.time = t.days   ORDER BY days
                 `;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
    // result = result.map(item=>{
    //   item['weekday'] = ["周日","周一","周二","周三","周四","周五","周六"][item.weekday]
    //   return item;
    // })
    this.ctx.body = {
      code:20000,
      data:result
    }
  }

  //地区人数统计
  async getAreaCount(){
    this.mysql = new Sequelize(this.config.sequelize);
      const sql =` SELECT city,COUNT(1) count  FROM users WHERE NOT city = '' GROUP BY city ORDER BY  count DESC  LIMIT 0,10`;
    let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
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
        "title": "口吐芬芳2.1内测版",
        "description": "一起来口吐芬芳 舌灿莲花 做一个儒雅随和的人",
        "url": `http://jige.lianfangti.cn/pages/nmsl/nmsl`,
        "picurl": "https://lft-ad.oss-cn-hangzhou.aliyuncs.com/eleme/png/nmsllogo.png"
    };
    try {
        await this.ctx.service.mpconfig.checkToken();

        this.ctx.body = await  this.ctx.service.weixin.sendServiceMessage({type:'news',articles,openid:'oUcAW5v08hJpsH49EUTIPJA_gCDo'});
    }catch (e) {
        console.error(`错误:`, e)
        this.ctx.body =e
    }
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


  //获取自动回复规则列表
  async getAutoReplayRuleList(){
      this.mysql = new Sequelize(this.config.sequelize);
      let {size=15,page=1,condition} = this.ctx.request.query;
      const countSQL = `SELECT count(1) as total FROM reply_rule `;
      const sql =` SELECT * FROM reply_rule ORDER BY created_at desc limit ${size * (page - 1)},${size}`;
      let result = await this.mysql.query(sql,{ type: this.mysql.QueryTypes.SELECT});
      let total =  await this.mysql.query(countSQL,{ type: this.mysql.QueryTypes.SELECT});
      this.ctx.body = {
          code:20000,
          data:{
              total:total[0]['total'],
              results:result
          }
      }
  }
}




module.exports = HomeController;
