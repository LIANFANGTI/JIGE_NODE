'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = JSON.stringify({ code: 0, msg: 'Hello  Egg' });
  }
}

module.exports = HomeController;
