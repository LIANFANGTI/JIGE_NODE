// 排行榜周期
module.exports = app => {
  const { STRING,JSON ,INTEGER } = app.Sequelize;
  const Stage = app.model.define("stage", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 周期名称
    type:STRING,// 类型
    reward: JSON,  // 奖励JSON JSON格式
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Stage.sync({alert: true,});
  return Stage;
};

