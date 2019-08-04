module.exports = app => {
  const { STRING, INTEGER,DATE,BOOLEAN } = app.Sequelize;
  const NoticeToUser = app.model.define("notice_user", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    uid:INTEGER, //用户id
    nid:INTEGER, //通知id
    read_status:BOOLEAN, // 阅读状态
    get_status:BOOLEAN, // 领取状态


  },{
    freezeTableName:true //表名将与modal名相同
  });
  // NoticeToUser.sync({force: true}).then(()=>{});
  return NoticeToUser;
};
