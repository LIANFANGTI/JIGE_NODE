'use strict';

const Controller = require('egg').Controller;

class ElemeController extends Controller {
  async index() {
    const { ctx } = this;
    const token = 'aHR0cHM6Ly93d3cubGlhbmZhbmd0aS5jbg==';

    const rules = {
      token:[
        {required: true},
        {custom:(item)=>{ return item === token },message: '无效Token'}
      ],
      phone:[
        {required: true},
        {type:'phone',message:'手机号格式不正确'}
      ],
      validate_code:[

      ],
      type:[
        {required: false},
        {in:[20 ,21 ], message:'请填写正确的type 20为拼手气  21为品质联盟'}
      ],



    };
    try {
      let data  = await  this.validate(rules,ctx.request.body);
      console.log(`调试:通过验证`, data)
      let result = await ctx.service.ele.getEleme(data);
      console.log(`调试:收到请求返回值`, result,new Date())
      try {
        result = JSON.parse(result);
        this.ctx.body = {
          code: result.code || 500,
          result
        }
      }catch (e) {
        this.ctx.body = {
          code: 500,
          result
        }
      }




    }catch (e) {
      console.log(`调试:未通过验证`, e)
    }
  }

  async validate(rules,data){
    const { ctx } = this;
    data = data || ctx.request.body;
    const typeMap= {
      string:value=>{ return typeof(value)=== 'string' },
      array :value=>{ return true },
      object:value=>{ return true},
      number:value=>{ return value instanceof Number },
      phone :value=>{ return value.length === 11;},
      email :value=>{ return true;}
    }
    let errors = []
    return  await  new Promise(((resolve, reject) => {
      for(let key in rules ){
        let rule = rules[key];
        for(let r of rule){
          let e = {}
          if(data[key]){ //是否存在该字段
            let value = data[key]
            console.log(`调试:存在data[${key}]=${value}`)

            if(r.type){ // 类型判断
              if(!typeMap[r.type](value)){
                e[key]=r.message || `字段[${key}]必须为${r.type}类型`
                errors.push(e)
              }
            }
            if(r.custom){ //自定义条件判断
              if(!r.custom(data[key])){
                e[key] = r.message
                errors.push(e)
              }
            }
            if(r.in){ //有效值判断
              let flag = false;
              for(let item of r.in){
                if(item == data[key]){
                  flag = true
                  break;
                }
              }
              if(!flag){
                e[key] = r.message
                errors.push(e)
              }
            }
          }else{ // 不存在
            if(r.required){  // 该字段是否必填
              e[key]=`[${key}]为必填项`
              errors.push(e)
              break;
            }
          }
        }
      }
      // console.log(`调试:错误统计`, errors,Boolean(errors.length))
      let result =  Boolean(errors.length);
      if(result){
        ctx.status = 400;
        ctx.body = {
          code:400,
          msg:'参数错误',
          errors
        }
        reject(errors)
      }else{
        resolve(data)
      }
    }))
  }
}

module.exports = ElemeController;
