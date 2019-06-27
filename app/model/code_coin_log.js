// 口令红包
module.exports = app => {
  const { INTEGER } = app.Sequelize;
  const Codecoinlog = app.model.define("code_coin_log", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    cid: INTEGER,  // 关键字
    uid: INTEGER,  // 赠送金币
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  Codecoinlog.sync({alert: true});
  return Codecoinlog;
};

