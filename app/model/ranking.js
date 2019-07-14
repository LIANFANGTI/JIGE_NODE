// 排行榜
module.exports = app => {
  const { STRING ,INTEGER } = app.Sequelize;
  const Ranking = app.model.define("ranking", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING,  // 别称
    type:STRING,//类型  week month all
    gift:STRING// 赠送礼物
  }, {
    freezeTableName: true //表名将与modal名相同
  });
  Ranking.sync({alert:true}).then(res=>{
    console.log(`调试:返回值`, res)
  });
  return Ranking;
};

