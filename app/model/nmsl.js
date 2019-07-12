// 充值套餐表
module.exports = app => {
  const { STRING,JSON ,INTEGER } = app.Sequelize;
  const Nmsl = app.model.define("nmsl", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    word: STRING,  // 方案名称
    type: JSON,  // 菜单内容 JSON格式
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Nmsl.sync({alert: true,force:true});
  return Nmsl;
};

