"use strict";

/** @type Egg.EggPlugin */
module.exports = {
    cors: {
        enable: true,
        package: "egg-cors"
    },
    sequelize: {
        enable: true,
        package: "egg-sequelize"
    },
    validatePlus: {
        enable: true,
        package: 'egg-validate-plus',
    },
    nunjucks: {
        enable: true,
        package: 'egg-view-nunjucks',
    },
    // assets : {
    //   enable: true,
    //   package: 'egg-view-assets',
    // }
};
