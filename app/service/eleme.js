'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const token = 'aHR0cHM6Ly93d3cubGlhbmZhbmd0aS5jbg==';
module.exports = class ElemeService extends Service {
    async getEleme(data) {
        const { ctx } = this;
        data['token'] = token;
        const url = 'http://ele.lianfangti.cn/ele';
        console.log(`\n\n #############################[${new Date()}]Ele接口调用日志#############################\n\n`,"请求数据:\n", {url,data});
        return await this.ctx.service.http.post({url, data}).then( async res => {
            console.log(`返回值[正常]:\n`, res,"\n\n");
            let errors = {
                0: "库存不足 可以用大礼包哦",
                1: "成功",
                2: "余额不足",
                50: "发送验证码状态 ",
                500: "手机号有误",
                501: "验证码已过期  请点击下方领红包按钮 重新获取验证码",
                502: "请重新获取验证码 ",
                503: "领取失败，可能是您今天次数已达上限，或请稍后再试",
                504: "领取失败，系统繁忙",
            };
            if(res.code === 50){
                let content = `正在为手机号[${data.phone}]下发验证码，请稍等... \n温馨提示: 如果这不是您的手机号,您可以重新发送手机号绑定`;
                await ctx.service.weixin.sendServiceMessage({content});
                if(res.result.message.indexOf("成功") !== -1){
                    errors[50] = `发送短信验证码成功,请您回复6位数验证码领取红包`
                }else{
                    res.code = 51;
                    errors[51] = res.result.message
                }

            }
            res['result']['token'] = token;
            return Promise.resolve({
                ...res,
                msg: errors[res.code] || '未知错误',
            })
        }).catch(err =>{
            console.log(`返回值[出错]:\n`, err,"\n\n");

            console.log(`错误:ele接口调用出错`, err);
            return Promise.reject(err);
        });
    }
    async getHongbaoUrl({openid}){

        const callbackurl = `http://eleme.lianfangti.cn/eleme/callback?openid=${openid}&jtoken=wx21bd29efec1e0b44`;
        try {
            let  formData = {
                xttoken:"jigezhushou",
                callbackUrl:encodeURI(callbackurl),
                method:'POST',
                openid
            };
            console.log(`调试:获取红包链接发送的参数`, formData);
            let res = await  this.ctx.service.http.post({
                url:`http://www.elmdhb.cn/elmdhb/getUrl`,
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                },
                formData
            });
            console.log(`调试:请求返回值`,res);
            let {data:{url}} = res;
            console.log(`调试:获取到url`, url);
            if(!url){
                return  Promise.reject({code:300,error:res});
            }
            return res.data;

        }catch (e) {
            console.log(`调试:临时红包出错`, e)
        }
    }
}
