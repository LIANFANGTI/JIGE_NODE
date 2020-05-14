/* eslint valid-jsdoc: "off" */
const path = require('path');
const errors = require("./errorcode");
"use strict";

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {
    cluster: {
      listen: {
        port: 7003
      }
    },
    view :{
      root:[
          path.join(appInfo.baseDir, 'app/view'),
      ].join(','),
      mapping: {
        '.nj': 'nunjucks',
        '.js': 'assets',
        '.css': 'assets'
      },
      defaultViewEngine: 'nunjucks',
    },
    validatePlus :{
      resolveError(ctx, errors) {
        if (errors.length) {
          ctx.type = 'json';
          ctx.status = 400;
          ctx.body = {
            code: 400,
            error: errors,
            message: '参数错误',
          };
        }
      }
    },
    security: {
      csrf: {
        enable: false,
        ignoreJSON:true
      }
    },
    domainWhiteList: ["*"],
    cors:{
      origin:'*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
    },
    logger:{
      outputJSON: true,
    },
    sequelize: {
      dialect: "mysql",
      database: "eleme",
      host: "ele.lianfangti.cn",
      port: 3306,
      username: "eleme",
      password: "lianfangti*",
      dialectOptions: {
        useUTC: false //for reading from database
      },
      timezone: '+08:00'
    },
    onerror: { // 异常流处理
      all(err, ctx) {
        // 在此处定义针对所有响应类型的错误处理方法
        // 注意，定义了 config.all 之后，其他错误处理方法不会再生效
        // try {
        //     let data = JOSN.parse(err.message);
        // }catch (e) {
        //     if(errors[err.message]){
        //       ctx.body = errors[err.message]
        //     }else{
        //       ctx
        //     }
        //
        //
        // }
        console.log(`调试:[${new Date()}]这里是捕获的错误信息`, err,err.code);
        // console.log(`调试:这里是捕获的错误上下文`, ctx);
        ctx.body = err.msg;
        ctx.status = err.status;
      },
      html(err, ctx) {
        // html hander
        ctx.body = '<h3>error</h3>';
        ctx.status = 500;
      },
      json(err, ctx) {
        // json hander
        ctx.body = { message: 'error' };
        ctx.status = 500;
      },
      jsonp(err, ctx) {
        // 一般来说，不需要特殊针对 jsonp 进行错误定义，jsonp 的错误处理会自动调用 json 错误处理，并包装成 jsonp 的响应格式
      },
    }
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1551017688905_3516";

  // add your middleware config here
  config.middleware = ['interceptor'];

  // add your user config here
  const userConfig = {};

  return {
    ...config,
    ...userConfig
  };
};
