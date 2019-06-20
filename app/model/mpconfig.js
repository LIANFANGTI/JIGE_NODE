module.exports = app => {
  const { STRING,FLOAT ,INTEGER } = app.Sequelize;
  const Config = app.model.define("mpconfig", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    token: STRING, // 接口调用TOKEN
    name: STRING,  // 公众号名称
    blance:FLOAT,  // 账户余额
    ex_coin:INTEGER, // 推广奖励金
    join_coin:INTEGER, // 新用户奖励金
    unit_coin:INTEGER, // 单个红包消耗积分
    unit_price:FLOAT, // 单个红包价格 由超管设置
    service_qr:STRING, // 客服微信二维码
    weixin:STRING,   //客服微信号
    recharge_plan:INTEGER,// 充值方案
    mp_token:STRING, // 与微信公众号对接的token
    encodingaeskey:STRING,// 公众号秘钥
    appid:STRING,// 公众号APPID
    appsecret:STRING, // 公众号APPSECRET

  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Config.sync({ alter: true })

  return Config;
};
