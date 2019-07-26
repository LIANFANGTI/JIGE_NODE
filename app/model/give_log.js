// 积分赠送记录表
module.exports = app => {
  const { INTEGER,STRING } = app.Sequelize;
  const Givelog = app.model.define("give_log", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    openid: STRING,  // 赠送对象
    message: STRING,  // 赠送时发送的消息
    remark:STRING,//赠送备注
    coin: INTEGER,  // 赠送金币
    giver:INTEGER, //赠送者id
    type: INTEGER // 类型  0 为 后台赠送  1 为 口令红包赠送  2为签到赠送 3推广奖励
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Givelog.sync({alert: true,force:true});
  return Givelog;
};

