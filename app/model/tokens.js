module.exports = app => {
  const { STRING, INTEGER,DATE,FLOAT } = app.Sequelize;
  const Tokens = app.model.define("tokens", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,//名称
    balance:FLOAT,//余额
    token:STRING// 当前调用的TOKEN
  },{
    freezeTableName:true //表名将与modal名相同
  });
  // Tokens.sync({force: true}).then(()=>{});
  return Tokens;
};
