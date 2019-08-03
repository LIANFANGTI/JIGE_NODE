module.exports = app => {
  const { STRING, INTEGER,DATE,FLOAT } = app.Sequelize;
  const Log = app.model.define("log", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    uid: STRING,
    times: INTEGER,
    balance: FLOAT,
    type: STRING, //红包类型
    amount: FLOAT, //红包金额
    token:STRING,// 当前调用的TOKEN
    sum_condition: FLOAT, //红包使用条件 满多少才减
    sn:STRING,//红包码
  },{
    freezeTableName:true //表名将与modal名相同
  });
  // Log.sync({force: true}).then(()=>{})
  return Log;
};
