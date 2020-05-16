# JIGE助手 饿了么

![](https://coding-net-production-static-ci.codehub.cn/bb6d176f-c7cd-46e6-8fc9-26ba839253a1.jpg)
## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.


### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```
新增了 node-canvas 模块 

可能需要安装依赖

#### linux: 
```$xslt
sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel
```
#### mac:
```$xslt
brew install pkg-config cairo pango libpng jpeg giflib
```
### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org
