'use strict';
const Service = require('egg').Service;
const requset = require('request-promise')

module.exports = class ElemeService extends Service {

  async getEleme(data) {
    let formData = {
      ...data,
      token: 'KnWy9PkJITtB91CVApFxxOw8GV6lhPjw54eD8LadItC9cBIky5FEP2TsS0aiUbDT',
       name: 'neweleme',
     }
     // console.log(`调试:最终发送的参数`, formData);
    console.log(`调试:开始发送请求`,new Date(),formData);

    return await requset({
      method: 'POST',
      url: 'https://www.emiaomiao.cn/',
      formData
    })

  }
}
