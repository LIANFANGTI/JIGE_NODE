// 触发自动回复关键字表
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Keywords = app.model.define("keywords", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    keyword: STRING,  // 关键词内容
    type: INTEGER, // 匹配规则  0 模糊查询 1 精确查询
    rule_id: INTEGER,  // 所属规则
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Keywords.sync({alert: true,force:true});
  return Keywords
};

