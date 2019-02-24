var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var conf = require('../conf.js');
process.env.NODE_ENV = process.env.NODE_ENV || "process.env.NODE_ENV";

// =====================================================连接数据库
mongoose.connect('mongodb://localhost/' + conf.db);
// 链接数据库
mongoose.connection.once('open', function() {
  console.log('数据库已连接');
});




// =====================================================API
// 提供所有的API
function API(app,io) {

  // post应该放在内部，不然就没有设置post
  app.use(bodyParser.urlencoded({ extended: false }));
  // app.use(bodyParser.json());

  // 开启跨域模式
  app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
  });

  // 测试API
  app.post(conf.test_api, function(req, res) {
    res.send({
      ret: 1
    });
  });

  // user_api
  var user_api = require('./modules/user_api.js');
  new user_api(app).init();


  // 启动邮件服务
  // new email().init();

  // 启动IO服务
  var IO = require('./tool/IO.js');
  new IO(io,app).init();
}



// ==============================都是代理模式启动
// 提供静态文件
app.use(express.static(path.join(__dirname, '../webapp/')));

// 提供api服务
// Io 服务；
API(app,io);


// app.listen(conf.api_port);
http.listen(conf.api_port, function() {
  console.log('app服务 启动在：' + conf.api_port);
});

