'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.user.init);
  router.get('/weixin', controller.weixin.index);
  router.post('/weixin', controller.weixin.index);
  router.get('/test', controller.weixin.test);
  router.post('/ele', controller.eleme.index);
};
