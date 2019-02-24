const Controller = require("egg").Controller;

module.exports = class LoginController extends Controller {
  async login() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;

    const defaultUsername = "admin";
    const defaultPassword = "123456";

    if (username === defaultUsername && password === defaultPassword) {
      ctx.body = {
        code: 0,
        msg: "login success"
      };
    } else {
      ctx.body = {
        code: 1,
        msg: "login fail"
      };
    }
  }
};
