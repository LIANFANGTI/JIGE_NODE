const Controller = require("egg").Controller;

module.exports = class UserController extends Controller {
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
