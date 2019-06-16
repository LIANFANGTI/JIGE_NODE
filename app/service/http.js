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
        })
    }

}
