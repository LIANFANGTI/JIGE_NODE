'use strict';
const BaseController = require("./BaseController");
const utils =require("../public/utils");
const Sequelize = require('sequelize');
class NoticeController extends BaseController {
  //获取周期列表
  async getNotice() {
    try {
      let user =  await  this.ctx.service.jige.checkXToken();
      const mysql = new Sequelize(this.config.sequelize);
      let {status = 'read_status'} = this.ctx.request.query;
      status =  status === 'all' ? 'read_status':status;
      let sql  = ` SELECT  nu.id,nid,title,remark,content,coin,type, nu.created_at ,read_status,get_status  FROM notice_user nu  JOIN notice  n ON nu.nid = n.id WHERE uid = ${user.id} AND read_status = ${status} ORDER BY nu.created_at DESC`;
      let list = await  mysql.query(sql,{type: mysql.QueryTypes.SELECT});


      this.ctx.body={
        code:0,
        data:{
          list:list.map(item=>{
            item['created_at'] = new Date( item['created_at']).Format('yyyy-MM-dd hh:mm');
            return item;
          })
        }
      }
    }catch (e) {
      this.ctx.body = e
    }

  }



  async sendNotice(){

  }



  async readNotice() {
    let {id} = this.ctx.request.body;
    let res = await this.ctx.model.NoticeUser.update({read_status: 1}, {where: {id}});
    this.ctx.body = {
      code: 0,
      data: {
        res
      }
    }
  }
  async getNoticeCoin(){
    let {id} = this.ctx.request.body;
    let result ={code:0,msg:''};
    let user =  await  this.ctx.service.jige.checkXToken();
    let noticeUserDetaile  =  await  this.ctx.model.NoticeUser.findOne({
      where:{id}
    });
    let noticeDetaile = await  this.ctx.model.Notice.findOne({
      where:{id:noticeUserDetaile.nid}
    });

    if(noticeUserDetaile.get_status){
      result.code=500,
      result.msg="您已经领取过"

    }else{
       let giveRes= await this.ctx.service.user.giveCoin({coin:noticeDetaile.coin,message:noticeDetaile.title,remark:noticeDetaile.remark,openid:user.openid,giver:0});
       if(giveRes){
           let updateNoticeToUserRes = await this.ctx.model.NoticeUser.update({get_status: 1}, {where: {id}});
           result.data={
             giveRes,
             updateNoticeToUserRes
           }
       }

    }
    this.ctx.body={
      ...result,
      data:{
        noticeUserDetaile,
        noticeDetaile,
        ...result.data
      }
      // res,

    }


  }





  async setNotice(){
    let {id} = this.ctx.params;
    let {stage} = this.ctx.request.body;
    stage.reward =JSON.stringify(stage.reward);
    let res=  await  this.ctx.model.Stage.update(stage,{where:{id}});
    this.ctx.body={
      code:20000,
      data:{
        stage,
        update:res
      }
    }

  }
}

module.exports = NoticeController;
