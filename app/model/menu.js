// 充值套餐表
module.exports = app => {
  const { STRING,JSON ,INTEGER } = app.Sequelize;
  const Menus = app.model.define("menus", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 方案名称
    json: JSON,  // 菜单内容 JSON格式
    owner:INTEGER, //创建者
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Menus.sync({alert: true,force:true});
  return Menus;
};

