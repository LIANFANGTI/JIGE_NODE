// 充值套餐表
module.exports = app => {
  const { STRING,FLOAT ,INTEGER } = app.Sequelize;
  const RechargePlan = app.model.define("recharge_plan", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 套餐名称
    price:FLOAT,  // 售价
    pay_price:FLOAT, // 优惠后价格（实际价格高）用于显示用
    coin:INTEGER, // 对应的充值积分
    pid:INTEGER, // 所属方案
    color:STRING,//主题颜色
    bg:STRING,//背景

  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // RechargePlan.sync({force: true}).then(()=>{});
  RechargePlan.sync({alert: true}).then(()=>{});

  return RechargePlan;
};
