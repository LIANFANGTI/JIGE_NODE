'use strict';
const Sequelize = require('sequelize');

const Controller = require('egg').Controller;

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
}



module.exports = HomeController;
