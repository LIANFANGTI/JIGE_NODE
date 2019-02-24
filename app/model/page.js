module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;
  const Page = app.model.define("Page", {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    title: STRING,
    logo: STRING,
    qr: STRING,
    phone: STRING,
    weixin: STRING,
    images: STRING,
    copyright: STRING,
    support: STRING
  });

  return Page;
};
