module.exports = app => {
  const { STRING, INTEGER,DATE,BOOLEAN } = app.Sequelize;
  const Notice = app.model.define("notice", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    uid:INTEGER,
    title:STRING,
    remark:STRING,
    content:STRING,
    coin:INTEGER,
    type:STRING,
    read_status:BOOLEAN,
    get_status:BOOLEAN


  },{
    freezeTableName:true //表名将与modal名相同
  });
  // Notice.sync({force: true}).then(()=>{});
  return Notice;
};
