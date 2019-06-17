'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');

module.exports = class HttpService extends Service {

    async get(options) {
        return await requset({
            ...options,
            method: 'GET',
            json: true

        })
    }

    async post(options) {
        return await requset({
            ...options,
            body: options.data || options.body,
            method: 'POST',
            json: options.json !==  undefined ? options.json : true
        }).then(res=>{
            console.log(`调试:POST请求返回值`, res);
            return  Promise.resolve(res)
        })
    }

}
