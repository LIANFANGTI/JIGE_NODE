module.exports = app => {
    const {STRING, INTEGER, DATE, BOOLEAN} = app.Sequelize;
    const User = app.model.define("users", {
        id: {type: INTEGER, primaryKey: true, autoIncrement: true},
        openid: STRING,
        times: INTEGER,
        father: INTEGER,
        phone: STRING,
        nickname: STRING,
        sex: INTEGER,
        city: STRING,
        headimgurl: STRING,
        subscribe: BOOLEAN,
        created_at: DATE
    }, {
        freezeTableName: true //表名将与modal名相同
    });
    // User.sync({force: true}).then(() => {
    // });
    return User;
};
