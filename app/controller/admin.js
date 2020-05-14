const BaseController = require("./BaseController");

const path = require('path');
const fs = require('fs');
const toArray = require('stream-to-array');
const sendToWormhole = require('stream-wormhole');
module.exports = class AdminController extends BaseController {
    async login() {
        const rules = {     //定义认证规则
            user: [  {required: true} ],
            password: [{required: true}]
        }
        let body = await this.validate(rules);  //验证表单
        try {
            let token = await this.ctx.service.mpconfig.Login(body); //调用登录

            this.ctx.set("Admin-Token",token); //往响应头中加入token
            this.ctx.body={   //响应数据
                code:20000,
                msg:'登录成功',
                token:token
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

    async getMpconfigDetaile(){
        let admin = await  this.ctx.service.mpconfig.checkAdminToken();
        let  { id }  = this.ctx.params;
        let result =await  this.service.mpconfig.detaile({id:admin.mpid});
        this.ctx.body=  {
            code:20000,
            data:result
        }
    }

    async updateMpconfigDetaile(){
        let {mpid} = await  this.ctx.service.mpconfig.checkAdminToken();
        let  data = this.ctx.request.body;
        let result = await this.service.mpconfig.update(data,{id:mpid})
        this.ctx.body=  {
            code:20000,
            data:result
        }
    }

    async uploadFile(){
        const stream = await this.ctx.getFileStream();
        let buf;
        try {
            const parts = await toArray(stream);
            buf = Buffer.concat(parts);
        } catch (err) {
            await sendToWormhole(stream);
            throw err;
        }
        const filename = new Date().getTime() + path.extname(stream.filename).toLowerCase();
        const target = path.join(this.config.baseDir, 'app/public/images', filename);
       let res=  await fs.writeFile(target, buf,()=>{});
        console.log(`调试:上传图片`, res);
        this.ctx.body = {
            code:20000,
            url:`/images/${filename}`,
            fill:`http://${this.ctx.request.headers.host}/images/${filename}`,
            context:this.ctx
        }

    }
    async getMenus() {
        let {mpid} = await  this.ctx.service.mpconfig.checkAdminToken();
        console.log(`调试:mpid`, mpid)
        let result = await this.ctx.service.mpconfig.getMenus({mpid});
        this.ctx.body = {
            code:20000,
            data:result
        }
    }

    async uploadToOss(){
      let res = await  this.ctx.service.http.uploadToOss()
      this.ctx.body = {
          code:0,
          msg:'上传成功',
          result:res
      }
    }


    async getUserNode(){
        let query = this.ctx.request.query;
        let { father }  = query;
        let data= await  this.ctx.model.User.findAll({
            attributes:["id","father","nickname","headimgurl"],
            where:{
                father
            }
        })
        this.ctx.body = {
            code:20000,
            data
        }
    }

}

