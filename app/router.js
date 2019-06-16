'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.user.init);
  router.get('/weixin', controller.weixin.index);
  router.get('/menu', controller.weixin.menu);
  router.post('/menu', controller.weixin.createMenu);
  router.post('/weixin', controller.weixin.index);
  router.get('/qr', controller.weixin.qr);
  router.get('/access_token', controller.weixin.getAccessToken);
  router.post('/ele', controller.eleme.index);
};

