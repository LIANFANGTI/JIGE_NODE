const Service = require("egg").Service;

module.exports = class UserService extends Service {
  async index() {
    return await this.ctx.model.Page.findAndCountAll({});
  }

  async addList(list) {
    const result = await this.ctx.model.Page.create(list);
    return result;
  }

  async getOne(id){
    const page = await this.ctx.model.Page.findById(id);
    if (!page) {
      this.ctx.throw(404, 'page not found');
    }
    return page;
  }

  async update({ id, updates }) {
    const page = await this.ctx.model.Page.findById(id);
    if (!page) {
      this.ctx.throw(404, 'page not found');
    }
    return page.update(updates);
  }

  async del(id) {
    const page = await this.ctx.model.Page.findById(id);
    if (!page) {
      this.ctx.throw(404, 'page not found');
    }
    return page.destroy();
  }
};
