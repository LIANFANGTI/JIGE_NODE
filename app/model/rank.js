// 榜单记录表
module.exports = app => {
  const { STRING,JSON ,INTEGER } = app.Sequelize;
  const Rank = app.model.define("rank", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    uid: INTEGER,  // 用户ID
    sid:INTEGER,// 周期ID
    fake:INTEGER,// 掺假值
    value:INTEGER, //值
    type:STRING, //排行榜类型  ex 推广排行 目前只有一种类型
    status: INTEGER,  //奖励发放状态
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Rank.sync({alert: true,});
  return Rank;
};

