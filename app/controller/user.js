const Controller = require("egg").Controller;

module.exports = class UserController extends Controller {
  async list(){
    const { ctx } = this;
    const admin = await  ctx.service.mpconfig.checkAdminToken();
    const {page,size} = ctx.request.query;
    // console.log(`调试:从token中获取信息`, admin);
    let users =  await  ctx.service.user.list({mp:admin.mpid,page,size});

    ctx.body = {
      code:20000,
      data:users
    }

  }


  async updateUser(){
    const { ctx } = this;
    let { user } = ctx.request.body;
    let {id} = ctx.params;
    console.log(`调试:收到user`, user,id);
    let res= await  this.ctx.model.User.update(user,{
      where:{
        id
      }
    })
  this.ctx.body={
        code:20000,
    res,
        msg:'ok'
  }


  }
  async list2(){
    const { ctx } = this;
    const admin = await  ctx.service.mpconfig.checkAdminToken();
    const {page,size} = ctx.request.query;
    // console.log(`调试:从token中获取信息`, admin);
    let users =  await  ctx.service.user.list2({mp:admin.mpid,page,size});

    ctx.body = {
      code:20000,
      data:users
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
