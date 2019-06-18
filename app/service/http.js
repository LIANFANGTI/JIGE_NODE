'use strict';
const Service = require('egg').Service;
const requset = require('request-promise');
const request2 = require('request');
const fs = require('fs');


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
            // console.log(`调试:POST请求返回值`, res);
            return  Promise.resolve(res)
        })
    }
    async download({url,type = 'buffer'}){
        return  await  new  Promise(((resolve, reject) => {
            let chunkArray = [],chunkSize = 0;
            let httpStream = request2({
                method:'GET',
                url
            });
            httpStream.on('response',response=>{
                // console.log(`调试: 响应头是`, response.headers)
            });

            httpStream.on('data',chunk=>{
                chunkArray.push(chunk);
                chunkSize += chunk.length
                // console.log(`调试:文件流`,chunk)
                console.log(`调试:文件下载中[${chunkSize}]`);

            });

            httpStream.on('close',()=>{
                console.log(`调试:文件加载完毕`)
                let buffer = Buffer.concat(chunkArray,chunkSize);
                // console.log(`调试:数据缓存`,buffer);
                resolve(buffer)
            })



        }))


    }

    async upload({url,data,json = true}){
        // console.log(`调试:要上传的文件`,options,"\n\n",options.file);
        return await new Promise(((resolve, reject) => {
            request2.post({
                url,
                json,
                formData:data
            }, (err,response,body) =>{
                response.on("response",res=>{
                    console.log(`调试:开始上传`)
                })
                response.on("data",chunk=>{
                    console.log(`调试:正在上传`,chunk)
                })
                response.on("close",chunk=>{
                    console.log(`调试:上传结束`);
                    if(!err && response.statusCode === 200){
                        resolve(body)
                    }else{
                        reject(err)
                    }
                })

            })
        }));

    }

}
