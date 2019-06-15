module.exports = app => {
  const { STRING, INTEGER,DATE } = app.Sequelize;
  const User = app.model.define("user", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    openid: STRING,
    times: INTEGER,
    father: INTEGER,
    phone:STRING,
    created_at: DATE
  },{
    freezeTableName:true //表名将与modal名相同
  });
  User.sync({force: true}).then(()=>{});
  return User;
};
