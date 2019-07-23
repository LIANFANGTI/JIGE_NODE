const {createCanvas, loadImage} = require('canvas');


module.exports= class Drawer{
    /**
     * 构造函数
     * @param width
     * @param height
     */
    constructor(width,height){
        this.width =width;
        this.height= height
        this.canvas = createCanvas(width,height);
        console.log(`调试:创建成功`, this.canvas );
        this.context = this.canvas.getContext('2d');
    }

    /**
     * 设置画布背景图
     * @param image 传入图片路径或Buffer 支持网络图片
     * @returns {Promise<void>}
     */
    async setBackgroundImage(image){
         return  await  this.drawImage({image,x:0,y:0,w:this.width,h:this.height})
    }
   async drawImage({image,x,y,w,h}){
       if(typeof image === 'string'){
           image =await loadImage(image).catch(err=>{
               console.error(`错误:图片加载失败`, err)
           });
           console.log(`调试:是地址`,image);
           // console.log(`调试:加载的图片Buffer`, image)
       }else{
           image = await  loadImage(image).catch(err=>{
               console.error(`错误:图片加载失败2`, err)
           });
           console.log(`调试:no path1`,image);
       }
       this.context.drawImage(image,x,y,w,h);
       console.log(`调试:图片绘制完成`,image);
       return  true;


   }
    /**
     * 设置画布背景色
     * @param color
     */
    setBackgroundColor(color){
        this.context.fillStyle = color;
        this.context.fillRect(0,0,this.width,this.height)
    }

    /**
     * 绘制元素 传入元素数组
     * @param elements
     */
   async drawElements(elements){
        for(let element of elements){
            let x,y;
            switch (element.type) {
                case "text":
                    console.log(`调试:绘制文字`, element);
                    this.context.fillStyle=element.color || "#000000";
                    if(element.size){
                        this.context.font = `${element.size}px Arial`;
                    }
                     y = element.y < 0 ? this.height + element.y:element.y;
                     x = element.x < 0 ? this.width+ element.x:element.x;
                     console.log(`调试:当前xy`, x,y);
                    this.context.fillText(element.content,x,y );
                break;
                case "image":
                    x = element.x || this.width / 2 - element.w / 2;
                   await this.drawImage({image:element.content,x ,y:element.y,w:element.w,h:element.h ||element.w});
                break;
            }

        }
    }


    getBuffer(){
        return this.canvas.toBuffer();
    }

    getDataURL(){
       return this.canvas.toDataURL();
    }
};

// class Element {
//     constructor(content,type,w,h,x,y){
//         this.content=content
//
//     }
//
// }

