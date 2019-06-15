'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.user.init);
  router.get('/weixin', controller.weixin.index);
  router.post('/weixin', controller.weixin.index);
  router.get('/qr', controller.weixin.qr);
  router.get('/access_token', controller.weixin.getAccessToken);
  router.post('/ele', controller.eleme.index);
};
let a = {
  "ToUserName":"oOT6M0dgESZdKs-LNU8AfmK4NVng",
  "FromUserName":"lianfangji",
  "CreateTime":"12345678",
  "MsgType":"text",
  "Content":"Hello I'm you father"
}
