// 积分赠送记录表
module.exports = app => {
  const { INTEGER,STRING,TEXT } = app.Sequelize;
  const Requestlog = app.model.define("request_log", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    url: TEXT('medium'),  // 请求地址
    method: STRING,  // 请求方法
    status:STRING,//请求状态
    query: TEXT('medium'),  // GET请求参数
    body: TEXT('medium'),  // POST请求参数
    take_time:TEXT('long'),
    data:TEXT('long'), //返回数据
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  // Requestlog.sync({alert: true,force:true});
  return Requestlog;
};

