
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
