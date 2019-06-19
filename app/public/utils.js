
exports.checkPhone =   function (phone){
    if(!(/^1(3|4|5|7|8)\d{9}$/.test(phone))){
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

}
