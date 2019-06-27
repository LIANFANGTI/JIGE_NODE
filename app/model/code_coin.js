// 口令红包
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Codecoin = app.model.define("code_coin", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    keyword: STRING,  // 关键字
    coin: INTEGER,  // 赠送金币
    min: INTEGER, // 随机范围
    max: INTEGER, // 随机范围
    log: INTEGER, // 已被领取个数
    limit:INTEGER, // 限制个数
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  Codecoin.sync({alert: true});
  return Codecoin;
};

