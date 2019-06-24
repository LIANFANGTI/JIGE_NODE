const Controller = require("egg").Controller;

module.exports = class OrdersController extends Controller {
  async list(){
    const { ctx } = this;
    const admin = await  ctx.service.mpconfig.checkAdminToken();
    const {page,size} = ctx.request.query;
    // console.log(`调试:从token中获取信息`, admin);
    let orders =  await  ctx.service.orders.list({mp:admin.mpid,page,size});

    ctx.body = {
      code:20000,
      data:orders
    }

  }
  async planList(){
    const admin = await  this.ctx.service.mpconfig.checkAdminToken();
    const result = await this.ctx.service.orders.getPlanList({mp:admin.mpid});
    this.ctx.body={
      code:20000,
      data:result,
    }
  }
  async rechargePlanList(){
    const admin = await  this.ctx.service.mpconfig.checkAdminToken();
    const {pid} = this.ctx.params;
    const result =  await  this.ctx.service.orders.getRechargePlanList({pid});
    this.ctx.body ={
      code:20000,
      data:result
    }
  }

  async updateRechargePlanList(){
    const {id} = this.ctx.params;
    const data =this.ctx.request.body;
    console.log(`调试:接收到的data`,data)
    const result = await  this.ctx.service.orders.updateRechargePlanList({id,data})
    this.ctx.body ={
      code:20000,
      data:result
    }

  }


  async init() {
    const { ctx } = this;
    let user = {
      openid:'test11',
      times:0,
      father:1,
    }
    const results = await ctx.service.user.add(user);
    ctx.body = {
      code: 0,
      results: results.rows
    };
  }
  async index() {
    const users = await this.ctx.model.User.findAll();
    this.ctx.body = users;
  }

  async show() {
    const user = await this.ctx.model.User.findByLogin(this.ctx.params.login);
    await user.logSignin();
    this.ctx.body = user;
  }
};
