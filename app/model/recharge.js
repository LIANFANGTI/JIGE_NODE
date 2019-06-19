module.exports = app => {
    const {STRING, INTEGER, DATE, FLOAT} = app.Sequelize;
    const Recharge = app.model.define("recharge", {
        id: {type: INTEGER, primaryKey: true, autoIncrement: true},
        aoid: STRING,// 平台唯一标识
        name:STRING,// 订单标题
        order_id: STRING, // 订单id
        price:FLOAT,//订单金额
        pay_price: FLOAT, // 充值 实际支付金额
        pay_time: DATE, // 支付时间
        more: STRING,  // 订单信息
        transaction_id: STRING, //流水号
        bank_type: STRING, // 付款方式
        buyer: STRING, // 订单关联用户 支付宝回调中有该信息 微信没有 在订单创建时写入
        status:STRING, //订单状态 0 未支付  1 已支付 2已退款
    }, {
        freezeTableName: true //表名将与modal名相同
    });
    // Recharge.sync({force: true}).then(()=>{})
    return Recharge;
};
