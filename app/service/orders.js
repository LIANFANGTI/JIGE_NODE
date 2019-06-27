const {Service} = require("egg")
const Sequelize = require('sequelize');

class RechargeService extends Service {

    //获取充值方案
    async getRechargePlans(){

    }

    async list({mp, page = 1, size = 10}) {
        console.log(`调试:接收到size[${size}],[${typeof(size)}]`);
        size = Number(size);
        let count =await this.ctx.model.Recharge.findAll({
            attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'total']],
            where: Sequelize.literal(`buyer IN (SELECT id FROM users WHERE mid = ${mp} )`)
        });
        const total  = count[0]['dataValues']['total'];
        // console.log(`调试:总记录数`,count[0], count[0]['dataValues']['total']);
        let results = await this.ctx.model.Recharge.findAll({
            attributes: {exclude: []},
            // include:[
            //     {
            //         model:this.ctx.model.User,
            //         required:true
            //     }
            // ],
            where:  Sequelize.literal(`buyer IN (SELECT id FROM users WHERE mid = ${mp} )`),
            order:[ ['created_at', 'DESC']],
            offset: (page - 1) * size,
            limit: size
        });
        for(let i in results){
            let buyer = results[i]['buyer'];
            let user =await this.ctx.model.User.findOne({
                attributes:["id","nickname"],
                where:{id:Number(buyer)}
            })
            // console.log(`调试:`, user)
            results[i].set("buyer",user.nickname)
        }

        return  {total,size,page,results};
    }

    async getPlanList({mp}){
        return  await  this.ctx.model.Plans.findAll({
            attributes: {exclude: []},
            where:{owner:mp}
        })
    }

   async getRechargePlanList({pid}){
        return  await  this.ctx.model.RechargePlan.findAll({
            attributes:{exclude:[]},
            where:{pid}
        })
   }
   async updateRechargePlanList({id,data}){
        return  await  this.ctx.model.RechargePlan.update(data,{where:{id}})
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
