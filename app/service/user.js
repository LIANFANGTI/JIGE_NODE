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
  async findOne({col=["id"],where = {}} = {}){
      return  await  this.ctx.model.User.findOne({
          attributes:col,
          where
      })

  };
  // showCol字段  如果查询结果存在  是否返回数据  默认false 返回 布尔值
  async exist({where={},col = ["id"],showCol = false}){
      // console.log(`调试:是否存在查询`, where);
      let result = await  this.select({col,where});
      return  showCol ? ( Boolean(result.length) ? result[0].dataValues : true) : Boolean(result.length)
  }
  async update(map,condition){
      console.log(`调试:要更新的字段`, map);
      return  await this.ctx.model.User.update(map,{where:condition})
  }

};
