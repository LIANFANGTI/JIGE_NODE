'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.user.init);
  router.get('/weixin', controller.weixin.index);
  router.post('/weixin/sendmessage', controller.weixin.sendServiceMessage);


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

  router.post('/user/login', controller.admin.login);
  router.get('/user/info', controller.admin.getInfo);
  router.get('/user/list', controller.user.list2);
  router.get('/recharge/list', controller.orders.list);
  router.get('/plan/list', controller.orders.planList);

  router.get('/recharge_plan/list/:pid/', controller.orders.rechargePlanList);
  router.put('/recharge_plan/:id/', controller.orders.updateRechargePlanList);

  router.get('/mpconfig/detaile', controller.admin.getMpconfigDetaile);
  router.put('/mpconfig/detaile', controller.admin.updateMpconfigDetaile);

  router.post('/upload', controller.admin.uploadToOss);

  router.get('/reset_token', controller.weixin.setAccessToken);
  router.get('/images/:filename', controller.render.images);
  router.get('/mpconfig/menu', controller.admin.getMenus);
  router.get('/home/paneldata', controller.home.index);


  router.get('/count/user', controller.home.getNewUserLineCount);
  router.get('/count/recharge', controller.home.getRechargeLineCount);
  router.get('/count/log', controller.home.getLogLineCount);


  router.get('/ktff', controller.home.ktff);
  router.get('/nmsl', controller.home.nmsl);





};
