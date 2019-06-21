const {Service} = require("egg")
const Sequelize = require('sequelize');
const db = new Sequelize('mysql://eleme:lianfangti*@example.com:3306/eleme');

class ConfigService extends Service {
    async checkToken(token) {
        const {ctx} = this;
        token = token || ctx.request.query.token
        if (token) {
            const mpconfig = await ctx.service.mpconfig.exist({
                col: ["appid", "id", "in_coin", "unit_coin", "token", "ex_coin", "join_coin", "unit_price", "appsecret"],
                showCol: true,
                where: {token}
            });
            if (mpconfig) {
                this.ctx.mpconfig = mpconfig;
                return Promise.resolve(mpconfig)
            } else {
                let result = {code: 400, msg: '无效Token'}
                ctx.body = result;
                return Promise.reject(result)
            }


        } else {
            let result = {code: 400, msg: '无效参数'};
            ctx.body = result;
            // this.ctx.logger.error(  new Error(result))
        }


    }

    //构建菜单
    async buildMenu() {
        let id = Sequelize.literal(`(SELECT  menu FROM mpconfig WHERE id  = ${this.ctx.mpconfig.id})`);
        let menu = await this.ctx.model.Menu.findOne({
            attributes: ["json"],
            where: {id}
        });

        return await this.ctx.service.weixin.createMenu({menu: JSON.parse(menu.json)});

    }

    async add(order) {
        // console.log(`调试:打印下Server的this`, this)
        return await this.ctx.model.Mpconfig.create(order);
    }

    async select({col = [], where = {}}) {
        return await this.ctx.model.Mpconfig.findAll({
            attributes: col,
            where
        })
    }

    async findOne({col = ["id"], where = {}} = {}) {
        return await this.ctx.model.Mpconfig.findOne({
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
        return await this.ctx.model.Mpconfig.update(map, {where: condition})
    }

}

module.exports = ConfigService
