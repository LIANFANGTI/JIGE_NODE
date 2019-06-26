const {Service} = require("egg")
const Sequelize = require('sequelize');
const utils = require("../public/utils");
const db = new Sequelize('mysql://eleme:lianfangti*@example.com:3306/eleme');

class ConfigService extends Service {
    async detaile({id}){
            return  await this.ctx.model.Mpconfig.findOne({
                attributes:{exclude: []},
                where:{id}
            })

    }

    async Login({username, password}) {

        let admin = await this.ctx.model.Admins.findOne({
            attributes: ['user', "password", "mpid"],
            where: {user: username}
        })
        if (admin) {
            console.log(`调试:密码判断admins.pwd[${admin.password}],body.password[${password}]`);
            if (admin.password === utils.md5(password)) {
                let mpconfig = await this.ctx.model.Mpconfig.findOne({attributes: ['token'], where: {id: admin.mpid}});
                let token = utils.md5(`${admin.user}${mpconfig.token}${new  Date().getTime()}`);
                await this.ctx.model.Admins.update({token}, {where: {user: username}});
                // console.log(`调试:登录成功所属账户`, mpconfig);
                return Promise.resolve(token)
            } else {
                console.log(`调试:密码错误`);
                return Promise.reject({code: 403, msg: "用户名密码不匹配", status: 400});
            }
        } else {
            // return  Promise.reject({code:403,msg:"啊啊啊",status:406   });
            return Promise.reject({code: 400, msg: "用户不存在", status: 400})
            // throw  new Error("用户不存在")
        }
        // return  utils.md5("123456");
        // ctx.body = utils.md5("123456");
        // this.ctx.model.Admins.create();

    }

    async checkAdminToken(token) {
        const {ctx} = this;
        token = token || this.ctx.headers['x-token'];
        if (token) {
            let admin = ctx.model.Admins.findOne({
                attributes: {exclude: ['password']},
                where: {token}
            })
            if (admin) {
                return admin
            } else {
                throw  new Error("Token 过期");
            }


        } else {
            throw  new Error("无权访问")
        }

        // token =  token || ctx.request
    }

    async checkToken(token) {
        const {ctx} = this;
        token = token || ctx.request.query.token;
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
            return Promise.reject(result)
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

     async getMenus({mpid}){
        return await  this.ctx.model.Menu.findOne({
            attributes: {exclude: []},
            where:Sequelize.literal(`id IN (SELECT menu FROM mpconfig WHERE id = ${mpid})`)
        })
    }

    async getAllConfig() {
        let result = await this.ctx.model.Mpconfig.findOne({
            attributes: {exclude: ['updated_at']},
            where: {id: this.ctx.mpconfig.id}
        });
        // console.log(`调试:获取到的所有配置信息`, result);
        return result
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

module.exports = ConfigService;
