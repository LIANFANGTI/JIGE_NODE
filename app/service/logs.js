const {Service} = require("egg")

class LogsService extends Service {
    async add(log) {
        // console.log(`调试:打印下Server的this`, this)
        return await this.ctx.model.Log.create(log);
    }

    async select({col = [], where = {}}) {
        return await this.ctx.model.Log.findAll({
            attributes: col,
            where
        })
    }

    async findOne({col = ["id"], where = {}} = {}) {
        return await this.ctx.model.Log.findOne({
            attributes: col,
            where
        })

    };

    // showCol字段  如果查询结果存在  是否返回数据  默认false 返回 布尔值
    async exist({where = {}, col = ["id"], showCol = false}) {
        // console.log(`调试:是否存在查询`, where);
        let result = await this.select({col, where});
        return showCol ? (Boolean(result.length) ? result[0].dataValues : true) : Boolean(result.length)
    }

    async update(map, condition) {
        console.log(`调试:要更新的字段`, map);
        return await this.ctx.model.Log.update(map, {where: condition})
    }

}

module.exports = LogsService
