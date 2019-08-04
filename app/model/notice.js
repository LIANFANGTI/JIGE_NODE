module.exports = app => {
  const { STRING, INTEGER,DATE,BOOLEAN } = app.Sequelize;
  const Notice = app.model.define("notice", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    title:STRING, // 标题
    remark:STRING, // 摘要
    content:STRING, // 内容
    coin:INTEGER, // 附带积分
    type:STRING, //类型
    code:STRING //复制值
  },{
    freezeTableName:true //表名将与modal名相同
  });
  // Notice.sync({alert: true}).then((res)=>{
  //   console.log(`调试:白哦同步`, res)
  // });
  return Notice;
};
