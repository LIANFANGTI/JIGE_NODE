'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/login', controller.login.login);

  router.get("/page", controller.list.index);
  router.get("/page/:id", controller.list.getOne);
  router.post("/page", controller.list.addPage);
  router.put("/edit/:id", controller.list.edit);
  router.delete("/page/:id", controller.list.del);
};
