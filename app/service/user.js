const { Service } = require("egg")
module.exports = class UserService extends Service {
  async add(user) {
    return await this.ctx.model.User.create(user);
  }
};
