
exports.checkPhone =   function (phone){
    if(!(/^1(3|4|5|7|8)\d{9}$/.test(phone))){
        return false;
    }else{
        return  true
    }
}
