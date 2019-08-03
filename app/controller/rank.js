'use strict';
const BaseController = require("./BaseController");
const utils =require("../public/utils");
class RankController extends BaseController {
  //获取周期列表
  async getStage() {
    let {type = 'week'}= this.ctx.request.query;
    let stage = await  this.ctx.model.Stage.findAll({
      attributes:['name','id'],
      where:{
        type
      }
    });
    let weekStart = utils.getWeekStartDate();  //获取本周周一
    let curStage = type==="week"? (weekStart.Format("WyyyyMMdd")):new Date().Format("yyyyMM");
    let existStage =await this.ctx.model.Stage.findOne({
      where:{name:curStage}
    })
    let currentStage = existStage ? existStage : await  this.ctx.model.Stage.create({
      name:curStage,
      type,
      reward: JSON.stringify([
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
      ])
    });
    currentStage.reward = JSON.parse( currentStage.reward);
    this.ctx.body={
      code:20000,
      data:{
        cur:currentStage,
        stages:stage
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
}

module.exports = RankController;
