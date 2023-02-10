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
    scale:3,
    toView:null,
    reverse:false
  },

  onLoad:function(){
    this.schoolIndex=0;
    this.mapCtx = wx.createMapContext('map', this);
    this.height=0;
  },

  onClick:function(){
    if(this.data.button_msg=="投胎" || this.data.button_msg=="重新投胎"){
      this.getLife(()=>{
        this.setData({msgList:[],button_msg:"成长",scrolltop:0});
        this.schoolIndex=0;
        let birthPlace=this.json["birthPlace"];
        this.addMsg(`出生于${birthPlace["area"]}`);
        this.onChangeView(birthPlace.lng,birthPlace.lat,birthPlace["area"],8);
      })
    }else if(this.data.msgList.length<=this.json["schoolList"].length){
      let school=this.json["schoolList"][this.schoolIndex];
      this.addMsg(`${school["level"]}就读于${school["name"]}`);
      this.schoolIndex++;
      this.onChangeView(school.lng,school.lat,school.name,16);
    }else{
      let industry=this.json["industry"];
      this.addMsg(`定居于${industry["province"]}，从事${industry["industry"]}，工资${industry["salary"]}`);
      let marker=this.data.markers[0];
      marker.alpha=0;
      marker.callout.content=null;
      this.setData({button_msg:"重新投胎",scale:3,markers:[marker]});
      
    }

  },

  addMsg:function(msg){
    let msgList=this.data.msgList;
    msgList.push({message:msg});
    this.setData({msgList,msgList});
    this.setData({toView:`item${this.data.msgList.length-1}`})
  },

  getLife:async function(callback){
    const res=await wx.cloud.callContainer({
      path:"/birth",
      header:{
        "X-WX-SERVICE": "cloud"
      },
      data:{
        reverse:this.data.reverse
      }
    });
    this.json=res.data;
    callback();
    // wx.request({
    //   url: 'http://127.0.0.1:5000/birth',
    //   data:{
    //     reverse:this.data.reverse
    //   },
    //   success:(res)=>{
    //     this.json=res.data;
    //     callback();
    //   }
    // })
    
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
          this.setData({scale:3})
          this.mapCtx.moveToLocation({latitude:lat,longitude:lng,success:()=>this.setData({markers:[marker],scale:scale})});   
        }else{
          this.mapCtx.moveToLocation({latitude:lat,longitude:lng,success:()=>this.setData({markers:[marker],scale:scale})});
        }
    }})
  },

  onReverse:function(){
    this.setData({reverse:!this.data.reverse});
  }
})