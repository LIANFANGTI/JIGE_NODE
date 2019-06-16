const { Service } = require("egg")
module.exports = class UserService extends Service {
  async add(user) {
    return await this.ctx.model.User.create(user);
  }
  async select({col=[],where = {}}){
      return  await this.ctx.model.User.findAll({
        attributes:col,
        where
      })
  }
  async exist({condition}){
      let result = await  this.select({col:["id"],where:condition});
      return Boolean(result.length)
  }
  async update(map,condition){
      console.log(`调试:要更新的字段`, map);
      return  await this.ctx.model.User.update(map,{where:condition})
  }
};
