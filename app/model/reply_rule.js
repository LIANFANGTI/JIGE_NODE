// 自动回复规则表
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Replyrules = app.model.define("reply_rule", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 规则名称
    rule: INTEGER,  // 回复规则 0 为随机回复1个  1 为全部回复
    owner:INTEGER, //规则所属的公众号
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Replyrules.sync({alert: true});
  return Replyrules
};

