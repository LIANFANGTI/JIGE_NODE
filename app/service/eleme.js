'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const token = 'aHR0cHM6Ly93d3cubGlhbmZhbmd0aS5jbg==';
module.exports = class ElemeService extends Service {
    async getEleme(data) {
        data['token'] = token
        const url = 'http://ele.lianfangti.cn/ele';
        return await this.ctx.service.http.post({url, data}).then(res => {
            let errors = {
                0: "库存不足",
                1: "成功",
                2: "余额不足",
                50: "发送验证码状态 ",
                500: "手机号有误",
                501: "验证码过期",
                502: "请重新获取验证码 ",
                503: "领取失败，可能是您今天次数已达上限，或请稍后再试",
                504: "领取失败，系统繁忙",
            }
            if(res.code === 50){
                errors[50] = res.result.message
            }
            return Promise.resolve({
                ...res,
                msg: errors[res.code] || '未知错误',
            })
        });
    }
}
