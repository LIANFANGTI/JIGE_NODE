// 充值套餐表
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Admins = app.model.define("admins", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING, // 昵称
    user: STRING,  // 登录名
    password: STRING,  // 菜单内容 JSON格式
    mpid:INTEGER, //创建者
    avatar:STRING, // 显示头像
    openid:STRING, // 关联的oepnid
    token:STRING, // 用户Token
    promise:STRING // 权限
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  Admins.sync({ alter: true });
  return Admins;
};

