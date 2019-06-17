const getRawBody = require("raw-body");
const xmlparser = require('xml2json');

/**
 * 接口req res拦截器
 */
module.exports = options => {
    return function* interceptor(next) {
        //拦截request请求
        // this.logger.info(`----入参----${JSON.stringify(this.request.body)}`);

        //入参参数校验
        try{
            //把xml转成json
            if(this.request.header["content-type"] === 'text/xml'){
                let buff = yield getRawBody(this.request.req);
                // console.log(`\n调试:获取到的Raw值`, buff)
                let resultjson = JSON.parse(xmlparser.toJson(buff)).xml;
                this.request.body = resultjson;
            } else {

            }

        } catch (e) {
            console.log(`调试:错误`, e);
            this.response.body = {
                code:500,
                msg:"JSON PARSE 出错"
            };
            // this.logger.info(`----出参----${JSON.stringify(this.response.body)}`);
            return;
        }

        //返回控制权给控制器
        yield next;
        //拦截response请求2610
        if(this.response.body){
            // this.logger.info(`----出参----${JSON.stringify(this.response.body)}`);
        }
    };
};
