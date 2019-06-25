module.exports = app => {
  const { STRING,FLOAT ,INTEGER,BOOLEAN } = app.Sequelize;
  const Config = app.model.define("mpconfig", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    token: STRING, // 接口调用TOKEN
    name: STRING,  // 公众号名称
    blance:FLOAT,  // 账户余额
    ex_coin:INTEGER, // 推广奖励金
    in_coin:INTEGER, // 被邀请者加积分
    join_coin:INTEGER, // 新用户奖励金
    unit_coin:INTEGER, // 单个红包消耗积分
    unit_price:FLOAT, // 单个红包价格 由超管设置
    service_qr:STRING, // 客服微信二维码
    weixin:STRING,   // 客服微信号
    recharge_plan:INTEGER,// 充值方案
    recharge_msg:STRING,// 充值页下方提示信息
    sign:BOOLEAN,// 签到开关
    sign_coin:INTEGER, // 签到积分
    limit:BOOLEAN,// 次数限制
    limit_number:INTEGER, // 限制次数
    limit_msg:STRING,
    mp_token:STRING, // 与微信公众号对接的token
    encodingaeskey:STRING,// 公众号秘钥
    appid:STRING,// 公众号APPID
    appsecret:STRING, // 公众号APPSECRET
    subscribe_msg:STRING,// 用户关注时自动回复
    comeback_msg:STRING,// 用户自动关注时回复
    help_message:STRING,//用户点教程时回复的消息
    menu:INTEGER //菜单方案ID

  }, {
    freezeTableName: true //表名将与modal名相同
  });
  Config.sync({ alter: true });
  //
  return Config;
};
