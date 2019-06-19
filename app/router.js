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
  router.post('/service', controller.weixin.addSerivce);
  router.get('/service', controller.weixin.getCustomService);
  router.get('/qr', controller.weixin.qr);
  router.get('/draw', controller.weixin.draw);
  router.get('/recharge', controller.weixin.recharge);
  router.get('/access_token', controller.weixin.getAccessToken);
  router.get('/template_message', controller.weixin.sendTemplateMessage);
  router.get('/service_message', controller.weixin.sendServiceMessage);
  router.get('/pay', controller.weixin.pay);
  router.get('/log', controller.weixin.log);
  router.post('/pay', controller.weixin.pay);
  router.post('/pay_callback', controller.weixin.payCallback);
};

