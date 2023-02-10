Page({
  data:{
    msgList:[],
    button_msg:"投胎",
    markers:[{
      id:0,
      iconPath:"/imgs/Marker1_Normal@3x.png",
      width:"34px",
      height:"34px",
      latitude:39.908702,
      longitude:116.397475,
      callout: {
        content: '',
        padding: 10,
        borderRadius: 2,
        display: 'ALWAYS'
      },
      alpha:0
    }],
    scale:3
  },

  onLoad:function(){
    this.schoolIndex=0;
    this.mapCtx = wx.createMapContext('map', this);
  },

  onClick:function(){
    if(this.data.button_msg=="投胎" || this.data.button_msg=="重新投胎"){
      this.getLife(()=>{
        let birthPlace=this.json["birthPlace"];
        this.setData({msgList:[],button_msg:"成长"});
        this.schoolIndex=0;
        this.addMsg(`出生于${birthPlace["area"]}`);
        this.onChangeView(birthPlace.lng,birthPlace.lat,birthPlace["area"],7);
      })
    }else if(this.data.msgList.length<=this.json["schoolList"].length){
      let school=this.json["schoolList"][this.schoolIndex];
      this.addMsg(`${school["level"]}就读于${school["name"]}`);
      this.schoolIndex++;
      this.onChangeView(school.lng,school.lat,school.name,15);
    }else{
      let industry=this.json["industry"]
      this.addMsg(`定居于${industry["province"]}，从事${industry["industry"]}，工资${industry["salary"]}`)
      this.setData({button_msg:"重新投胎"});
    }

  },

  addMsg:function(msg){
    let msgList=this.data.msgList;
    msgList.push({message:msg});
    this.setData({msgList,msgList});
  },

  getLife:async function(callback){
    const res=await wx.cloud.callContainer({
      path:"/birth",
      header:{
        "X-WX-SERVICE": "cloud"
      },
    });
    this.json=res.data;
    callback();
  },

  onChangeView:function(lng,lat,name,scale){
    let marker=this.data.markers[0]
    if(marker.alpha==0)marker.alpha=1
    marker.latitude=lat;
    marker.longitude=lng;
    marker.callout.content=name;

    this.mapCtx.getCenterLocation({
      success:(res)=>{
        if(Math.abs(lng-res.longitude)>2 || Math.abs(lat-res.latitude)>2){
          this.setData({scale:3});
          setTimeout(() => {this.mapCtx.moveToLocation({latitude:lat,longitude:lng});this.setData({markers:[marker]});},1000);    
          setTimeout(() => this.setData({markers:[marker],scale:scale}), 2000);
        }else{
          this.setData({markers:[marker],scale:scale})
          this.mapCtx.moveToLocation({latitude:lat,longitude:lng})          
        }
    }})
  }
})