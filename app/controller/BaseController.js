const Controller = require("egg").Controller;
class BaseController extends Controller {
  /*** @author  lianfangti@qq.com 2019年06月18日 14:36:07
   * * @TODO    TODO SOME THING*
   * @param    rules: Object  传入验证规则 必填
   * @param    data: Object   传入验证数据 可选 如果data 为空则 默认根据type 从 POST参数或 GET参数中取数据验证
   * @param    type: String   传入验证类型 可选 默认POST
   * @returns { Promise }
   * */
  async validate({rules = {},data,type = 'POST'} = {}) {
    const {ctx} = this;
    data = data || (type === "POST" ? ctx.request.body : ctx.request.query);
    console.log(`调试:开始验证参数`,data,rules);

    const typeMap = {
      string: value => {
        return typeof (value) === 'string'
      },
      array: value => {
        return true
      },
      object: value => {
        return true
      },
      number: value => {
        return value instanceof Number
      },
      phone: value => {
        return value.length === 11;
      },
      email: value => {
        return true;
      }
    }
    let errors = [];
    // console.log(`调试:到这里参数定义结束还正常 运行`)
    return await new Promise(((resolve, reject) => {
      for (let key in rules) {
        let rule = rules[key];
        for (let r of rule) {
          let e = {}
          if (data[key]) { //是否存在该字段
            let value = data[key]
            console.log(`调试:存在data[${key}]=${value}`)

            if (r.type) { // 类型判断
              if (!typeMap[r.type](value)) {
                e[key] = r.message || `字段[${key}]必须为${r.type}类型`
                errors.push(e)
              }
            }
            if (r.custom) { //自定义条件判断
              if (!r.custom(data[key])) {
                e[key] = r.message
                errors.push(e)
              }
            }
            if (r.in) { //有效值判断
              let flag = false;
              for (let item of r.in) {
                if (item == data[key]) {
                  flag = true
                  break;
                }
              }
              if (!flag) {
                e[key] = r.message
                errors.push(e)
              }
            }
          } else { // 不存在
            if (r.required) {  // 该字段是否必填
              e[key] = `[${key}]为必填项`
              errors.push(e)
              break;
            }
          }
        }
      }
      // console.log(`调试:错误统计`, errors,Boolean(errors.length))
      let result = Boolean(errors.length);
      if (result) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          msg: '参数错误',
          errors
        }
        reject(errors)
      } else {
        resolve(data)
      }
    }))
  }
}
module.exports =  BaseController
