// 充值套餐表
module.exports = app => {
  const { STRING,FLOAT ,INTEGER } = app.Sequelize;
  const Plans = app.model.define("plans", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 方案名称
    owner:INTEGER, //创建者
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Plans.sync({force: true}).then(()=>{});
  return Plans;
};

