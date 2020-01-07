const {md5} = require("./js/md5");
const fs = require('fs');
exports.checkPhone =   function (phone){
    if(!(/^1(3|4|5|7|8|6|9)\d{9}$/.test(phone))){
        return false;
    }else{
        return  true
    }
}

exports.checkVerificationCode = function (value) {
    reg=/^[0-9]{6}$/;
    if(reg.test(value)){
        return  true
    }else{
        return false
    }

}

/**
 *  @author  lianfangti@qq.com 2019年06月13日 15:56:41
 *  @TODO    对象转url参数
 *  @param   { Object }  params
 *  @returns { String }
 * */
exports.encodeParams = function(params = {}) {
    let  s = '?';
    for(let key in params){
        s += `${key}=${params[key]}&`
    }
    return s.substring(0,s.length -1);
}
/**
 *  @author  lianfangti@qq.com 2019年06月13日 15:56:41
 *  @TODO    url参数转对象
 *  @param   { String }  url
 *  @returns { Object }
 * */
exports.decodeParams = function(url) {
    let result = {};
    if(url.indexOf('?')!== -1){
        url.split('?')[1].split('&').forEach(item=>{result[item.split('=')[0]] = item.split('=')[1] });
    }else{
        url.split('&').forEach(item=>{result[item.split('=')[0]] = item.split('=')[1] });
    }
    return result

};

exports.md5 = function (string) {
   return md5(string)
};


exports.readImageToBuffer = async function(path) {
    return  await  new Promise(((resolve, reject) => {
        fs.readFile(path,function (err,origin_buffer) {
            let buffer = Buffer.isBuffer(origin_buffer);
            // console.log(`调试:`, origin_buffer)
            resolve(origin_buffer)
            // ctx.body = origin_buffer;

        })
    }))

};
exports.RandomNum = function (Min,Max,range="[]") {
    switch (range) {
        case "[]":
            var Range = Max - Min;
            var Rand = Math.random();
            var num = Min + Math.round(Rand * Range);
        break;
        case "[)":
            var Range = Max - Min;
            var Rand = Math.random();
            var num = Min + Math.floor(Rand * Range); //舍去fixtest
        break;
        case "(]":
            var Range = Max - Min;
            var Rand = Math.random();
            if(Math.round(Rand * Range)==0){
                return Min + 1;
            }
            var num = Min + Math.round(Rand * Range);
        break;
        case "()":
            let index =0;
            var Range = Max - Min;
            var Rand = Math.random();
            if(Math.round(Rand * Range)==0){
                return Min + 1;
            }else if(Math.round(Rand * Max)==Max)
            {
                index++;
                return Max - 1;
            }else{
                var num = Min + Math.round(Rand * Range) - 1;
                return num;
            }
        break;
    }

    return num;
};
exports.decode =(str)=>{
    return Buffer.from(str,'base64').toString();
};
exports.encode = (str)=>{
    return Buffer.from(str+``).toString('base64')
};

exports.getWeekStartDate = ()=> {
    var now = new Date();
    var nowTime = now.getTime() ;
    var day = now.getDay();
    var oneDayTime = 24*60*60*1000 ;
    var MondayTime = nowTime - ((!day?7:day)-1)*oneDayTime ;  // 周一等于  当前时间戳 - （今天周几-1）* 一天的秒数  因为周日的 day值为0 所以当是周日时  day=7  这样一周是从周一开始算了
    return new Date(MondayTime);
};


