'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const request2 = require('request');
const oss = require('ali-oss')
const fs = require('fs');
const path = require('path');



module.exports = class HttpService extends Service {

    async get(options) {
        let startTime= new Date().getTime();
        let urlarr= options.url.split("?");
        let log = {
            url:urlarr[0],
            query:urlarr[1],
            method: 'POST',
            data: JSON.stringify(options.data || options.body ||  options.formData),
        };
        return await requset({
            ...options,
            method: 'GET',
            resolveWithFullResponse:true,
            json: true

        }).then(res=>{
            let finishTime = new Date().getTime();
            log["take_time"] = finishTime  - startTime;
            log["body"] = JSON.stringify(res.body);
            log["status"] = res.statusCode;
            this.ctx.model.RequestLog.create(log);
            return Promise.resolve(res.body)
        }).catch(err=>{
            return Promise.reject(err)
        })
    }

    async post(options) {
        console.log(`调试:你调用了POST请求`);
        let startTime= new Date().getTime();
        let urlarr= options.url.split("?");
        let log = {
            url:urlarr[0],
            query:urlarr[1],
            method: 'POST',
            data: JSON.stringify(options.data || options.body ||  options.formData),
        };
        return await requset({
            ...options,
            body: options.data || options.body,
            resolveWithFullResponse:true,
            method: 'POST',
            json: options.json !== undefined ? options.json : true
        }).then(res => {
            let finishTime = new Date().getTime();

            log["take_time"] = finishTime  - startTime;
            log["body"] = JSON.stringify(res.body);
            log["status"] = res.statusCode;
            this.ctx.model.RequestLog.create(log);
            console.log(`调试:POST请求返回值`, log);

            return Promise.resolve(res.body)
        }).catch(res=>{
            let finishTime = new Date().getTime();
            log["take_time"] = finishTime  - startTime;
            log["body"] = JSON.stringify(res.message || res);
            log["status"] = res.statusCode;
            console.log(`POST请求出错`, log);
            this.ctx.model.RequestLog.create(log);
            return Promise.reject({from:'POST请求出错',errors:res.message || res})
        })
    }

    async download({url, type = 'buffer'}) {
        return await new Promise(((resolve, reject) => {
            let chunkArray = [], chunkSize = 0;
            let httpStream = request2({
                method: 'GET',
                url
            });
            httpStream.on('response', response => {
                // console.log(`调试: 响应头是`, response.headers)
            });

            httpStream.on('data', chunk => {
                chunkArray.push(chunk);
                chunkSize += chunk.length
                // console.log(`调试:文件流`,chunk)
                console.log(`调试:文件下载中[${chunkSize}]`);

            });

            httpStream.on('close', () => {
                console.log(`调试:文件加载完毕`)
                let buffer = Buffer.concat(chunkArray, chunkSize);
                // console.log(`调试:数据缓存`,buffer);
                resolve(buffer)
            })


        }))


    }
    async uploadToOss(){
        const { ctx, service, app } = this;
        let parts = ctx.multipart({ autoFields: true });
        let data = ctx.request.body
        let stream;
         const client = new oss({
             accessKeyId: 'LTAIRyHJ2BEtUjaR',
             accessKeySecret: 'ZYnxle0EIypBLFX4wR6Ol4qFo24UUL',
             bucket: 'lft-ad',
             region: 'oss-cn-hangzhou',//替换成自己的地区，我这是深圳
         });
         let result;
        while ((stream = await parts()) != null) {
            if (!stream.filename) {
                break;
            }
            // console.log(`调试:`,);
            let { name,id } = parts.field;

            let pathname = `eleme/upload/${name}/${id}${path.extname(stream.filename)}`;

            result=   await   client.putStream(pathname, stream);
            // console.log(`调试:图片上传`, r1)
            // client.putStream(name, stream).then(function (r1) {
            //     console.log('put success: %j',r1);
            //     return client.get('object');
            // }).then(function (r2) {
            //     // console.log('get success: %j');
            //     console.log(`调试:上传成功`,r2)
            // }).catch(function (err) {
            //     console.error('上传出错',err);
            // });

        }
        return result;



    }

    async upload({url, data, json = true}) {
        // console.log(`调试:要上传的文件`,options,"\n\n",options.file);
        return await new Promise(((resolve, reject) => {
            request2.post({
                url,
                json,
                formData: data
            }, (err, response, body) => {
                response.on("response", res => {
                    console.log(`调试:开始上传`)
                })
                response.on("data", chunk => {
                    console.log(`调试:正在上传`, chunk)
                })
                response.on("close", chunk => {
                    console.log(`调试:上传结束`);
                    if (!err && response.statusCode === 200) {
                        resolve(body)
                    } else {
                        reject(err)
                    }
                })

            })
        }));

    }

}
