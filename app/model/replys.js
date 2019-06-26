// 自动回复内容表
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Replys = app.model.define("replys", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    type: INTEGER,  // 回复类型 1 文本 2 图片
    content: STRING,  // 回复内容
    rule_id: INTEGER,  // 所属规则
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Replys.sync({alert: true});
  return Replys
};

