// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: '你的云托管环境id',//这里使用你的云托管环境id
        traceUser: true,
      });
    }
  }
});
