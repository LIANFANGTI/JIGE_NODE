const BaseController = require("./BaseController");


module.exports = class AdminController extends BaseController {
    async login() {
        const rules = {
            user: [
                {required: true}
            ],
            password: [
                {required: true}
            ]
        }
        let body = await this.validate(rules);
        try {
            let token = await this.ctx.service.mpconfig.Login(body);

            this.ctx.set("Admin-Token",token);
            this.ctx.body={
                code:20000,
                msg:'登录成功',
                token
            }
        }catch (e) {
            console.log(`调试:`, e);
            this.ctx.status = e.status || 500;
            delete e['status'];
            this.ctx.body = e;
        }

    };
    async getInfo(){
        let admin = await this.ctx.service.mpconfig.checkAdminToken();
        this.ctx.body = {code:20000,data:admin}
    }
}
