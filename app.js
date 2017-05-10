var express = require('express');
var app = express();
//socket.io公式：
var http = require('http').Server(app);
var io = require('socket.io')(http);

//静态服务
app.use(express.static("./webapp"));


// post 请求中间件
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });


var all_user = [];
var all_socket = [];

// 登录
app.post("/sign_in", urlencodedParser, function(req, res, next) {
  var name = req.body.name;
  // 用户不存在
  if (all_user.indexOf(name) == -1) {
    // 收集用户
    all_user.push(name);
    res.send({ ret: 0 });
  }
  // 用户存在
  else {
    res.send({ ret: 1 });
  }
});



io.on("connection", function(socket) {
  // 登录成功后才进行聊天
  socket.on("talk", function(msg) {
    //把接收到的msg原样广播 
    io.emit("talk", msg);
  });
});













// io.on("connection", function(socket) {
//   socket.on("liaotian",function(msg){
//   	//把接收到的msg原样广播 
//   	io.emit("liaotian",msg);
//   });
// });

//监听
http.listen(3000);
console.log('3000端口打开~~');
