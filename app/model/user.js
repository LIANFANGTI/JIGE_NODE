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
        mid:INTEGER,
        subscribe: BOOLEAN,
        created_at: DATE,
        last_sign:DATE,//最近签到时间
        conn_sign:INTEGER,//连续签到时间
        week_ex:INTEGER,
        month_ex:INTEGER,
        all_ex:INTEGER

    }, {
        freezeTableName: true //表名将与modal名相同
    });
    // User.prototype.associate = function(){
    //     User.hasMany(app.model.Recharge,{as:'recharges'})
    // }
    // User.sync({ alter: true });
    // User.sync({force: true}).then(() => {
    // });
    return User;
};
