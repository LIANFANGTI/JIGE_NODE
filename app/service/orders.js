const {Service} = require("egg")

class RechargeService extends Service {

    //获取充值方案
    async getRechargePlans(){

    }

    async getOrderStatus(order_id){
        let result = await  this.ctx.model.Recharge.findOne({
            attributes:["status"],
            where:{order_id}
        })
        return  result.status

    }


    async add(order) {
        // console.log(`调试:打印下Server的this`, this)
        return await this.ctx.model.Recharge.create(order);
    }

    async select({col = [], where = {}}) {
        return await this.ctx.model.Recharge.findAll({
            attributes: col,
            where
        })
    }

    async findOne({col = ["id"], where = {}} = {}) {
        return await this.ctx.model.Recharge.findOne({
            attributes: col,
            where
        })

    };

    // showCol字段  如果查询结果存在  是否返回数据  默认false 返回 布尔值
    async exist({where = {}, col = ["id"], showCol = false}) {
        // console.log(`调试:是否存在查询`, where);
        let result = await this.select({col, where});
        return showCol ? (Boolean(result.length) ? result[0].dataValues : false) : Boolean(result.length)
    }

    async update(map, condition) {
        console.log(`调试:要更新的字段`, map);
        return await this.ctx.model.Recharge.update(map, {where: condition})
    }

}

module.exports = RechargeService
