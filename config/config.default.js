/* eslint valid-jsdoc: "off" */
const path = require('path');
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
