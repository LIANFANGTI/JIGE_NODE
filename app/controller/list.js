const Controller = require("egg").Controller;

module.exports = class ListController extends Controller {
  async index() {
    const { ctx } = this;
    const results = await ctx.service.list.index();
    ctx.body = {
      code: 0,
      results: results.rows
    };
  }

  async addPage() {
    const { ctx } = this;
    const list = ctx.request.body;

    try {
      const result = await ctx.service.list.addList(list);
      ctx.body = {
        code: 201,
        msg: "success"
      };
    } catch (e) {
      ctx.body = {
        code: 400,
        msg: "fail"
      };
    }
  }

  async getOne() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const result = await ctx.service.list.getOne(id);
      ctx.body = {
        code: 200,
        result
      };
    } catch (e) {
      ctx.body = {
        code: 400,
        msg: e.message
      };
    }
  }

  async edit() {
    const { ctx } = this;
    const { id } = ctx.params;
    const body = ctx.request.body;
    try {
      const result = await ctx.service.list.update({ id, updates: body });
      ctx.body = {
        code: 200,
        result
      };
    } catch (e) {
      ctx.body = {
        code: 400,
        msg: e.message
      };
    }
  }

  async del() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const result = await ctx.service.list.del(id);
      ctx.body = {
        code: 200,
        result
      };
    } catch (e) {
      ctx.body = {
        code: 400,
        msg: e.message
      };
    }
  }
};
