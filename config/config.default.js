/* eslint valid-jsdoc: "off" */

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
    security: {
      csrf: {
        enable: false
      }
    },
    domainWhiteList: [],
    sequelize: {
      dialect: "mysql",
      database: "AD",
      host: "www.deepand.com",
      port: 3306,
      username: "root",
      password: "1005.Deepand"
    }
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1551017688905_3516";

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {};

  return {
    ...config,
    ...userConfig
  };
};
