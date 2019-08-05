'use strict';
const BaseController = require("./BaseController");
const utils =require("../public/utils");
class RankController extends BaseController {
  //获取周期列表
  async getStage() {
    let {type = 'week'}= this.ctx.request.query;
    let {stage = 'new'}= this.ctx.request.query;
    let stages = await  this.ctx.model.Stage.findAll({
      attributes:['name','id'],
      where:{
        type
      }
    });
    let weekStart = utils.getWeekStartDate();  //获取本周周一
    let curStage = type==="week"? (weekStart.Format("WyyMMdd")):new Date().Format("yyyyMM");
    curStage = stage === 'new' ? curStage : stage;
    let existStage =await this.ctx.model.Stage.findOne({
      where:{name:curStage}
    })
    let currentStage = existStage ? existStage : await  this.ctx.model.Stage.create({
      name:curStage,
      type,
      reward: `${JSON.stringify([ 
        {name:'第一名奖励',coin: 100 },
        {name:'第二名奖励',coin: 90 },
        {name:'第三名奖励',coin: 80 },
        {name:'第四名奖励',coin: 70 },
        {name:'第五名奖励',coin: 60 },
        {name:'第六名奖励',coin: 50 },
        {name:'第七名奖励',coin: 40 },
        {name:'第八名奖励',coin: 30 },
        {name:'第九名奖励',coin: 20 },
        {name:'第十名奖励',coin: 10 },
      ])}`
    });
    currentStage.reward = JSON.parse( currentStage.reward);
    this.ctx.body={
      code:20000,
      data:{
        cur:currentStage,
        stages:stages
      }
    }

  }

  async setFakeUser(){
    let {fake,sid,uid} = this.ctx.request.body;
    let res=  await  this.ctx.model.Rank.update({fake},{where:{sid,uid}});
    this.ctx.body={
      code:20000,
      data:{
        fake,
        update:res
      }
    }

  }


  async setStage(){
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
 //奖励发放
  async sendReward(){
     let {uid,reward,stage,index}=this.ctx.request.body;
     index = index * 1 + 1;
     let user = await this.ctx.model.User.findOne({ where:{id:uid} });
     let sendRes = await  this.sendNotice({
              title:`${stage.name}期打榜奖励`,
              remark:`恭喜你在${stage.name}期打榜活动中获得第${index}名...`,
              content:`恭喜你在${stage.name}期打榜活动中获得第${index}名成绩,系统奖励你<view class="text-red">${reward.coin}</view>粮票 点击下方按钮领取`,
              coin:reward.coin,
              type:'coin',
              to:[uid]
     });
     try {
       let admin = await this.ctx.service.mpconfig.checkAdminToken();

       let sendTemplateMessageRes = await  this.ctx.service.weixin.sendTemplateMessage({
         openid:user.openid,
         template_id:'NnT-m97VXVt3pQgTVeMiU9enDUr3CW43vSf3k9V_XvE',
         url:'http://jige.lianfangti.cn/?token=wx21bd29efec1e0b44',
         first:'打榜奖励发放',
         keyword1:`${stage.name}期打榜奖励第${index}名`,
         keyword2:new Date().Format('yyyy年MM月dd日 hh:ss'),
         keyword3:`${reward.coin}粮票`,
         remark:'点击领取',
       });
       let updateStatus = await  this.ctx.model.Rank.update({
         status:1,
       },{where:{ uid,sid:stage.id }});
       this.ctx.body={
         code:20000,
         data:{
           sendRes,
           updateStatus,
           sendTemplateMessageRes
         }
       }
     }catch (e) {
       console.error(`错误:捕获错误`, e);
       throw  e
     }






  }

  /**
   * 发送通知
   * @param title      通知标题
   * @param remark     通知摘要
   * @param content    通知内容
   * @param type       通知类型  msg 普通消息   coin 带金币    url 链接消息   copy  带复制内容的
   * @param coin       赠送金币
   * @param to         接收方 接收一个存放接收用户id的数组
   * @param template   是否发送模板消息通知
   * @returns {Promise<void>}
   */
  async sendNotice({title,remark='',content,type ='msg',coin=0,to=[],template=false}){
      let notice = await  this.ctx.model.Notice.create({
        title,
        remark,
        content,
        type,
        coin
      });
      let sendLog=[];
      for(let uid of to){
       let res =  await this.ctx.model.NoticeUser.create({
            uid,
            nid:notice.id,
         });
        sendLog.push(res);
      }
      return  {notice,sendLog}

  }
}

module.exports = RankController;
