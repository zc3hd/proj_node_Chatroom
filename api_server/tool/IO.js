// 全局工具函数
var FN = require('./common.js');



function Module(io, app) {
  var me = this;
  me.io = io;

  // 
  me.app = app;
  // 路由
  me.router = require('express').Router();

  // 收集用户的所有通道信息
  me.all = {
    // 所有的通道
    socket: {

    },
  };

  // 模型
  me.User_model = require('../collection/user.js');
}
Module.prototype = {
  init: function() {
    var me = this;

    me._bind();

    // 所有用户连接到后台；双向 可接收、发送
    me._IO_connect(function(socket) {
      // 所有的事件只能在当前socket注册事件

      // 新用户 出去进来时 先做下登记；
      me._one_newUser_init(socket);

      // 个人新的身份信息登记 且 广播给所有人
      me._one_newUser_all(socket);

      // 新信息
      me._one_newInfo_all(socket);

      // 用户下线
      me._one_userOut_all(socket);

      // 新信息给个人
      me._one_newInfo_one(socket);
    });


    // 配置前缀
    me.api_pro = '/api/user';
    // save_loc
    me.router.post('/save_loc.do', function(req, res) {
      me._save_loc(req, res);
    });
    // upd_info
    me.router.post('/upd_info.do', function(req, res) {
      me._upd_info(req, res);
    });
    me.app.use(me.api_pro, me.router);
  },
  _bind: function() {
    var me = this;
    var fns = {
      // 保存位置,注册昵称
      _save_loc: function(req, res) {
        var me = this;

        me.User_model
          .findById(req.body._id)
          .then(function(data) {


            // 更新数据库数据
            data.net_name = req.body.net_name;
            data.sex = req.body.sex;
            data.lng = req.body.lng;
            data.lat = req.body.lat;


            // 同步 IO sc数据
            me.all.socket[data._id].all.net_name = req.body.net_name;
            me.all.socket[data._id].all._id = req.body._id;
            me.all.socket[data._id].all.sex = req.body.sex;
            me.all.socket[data._id].all.lng = req.body.lng * 1 + me._map_loc_random();
            me.all.socket[data._id].all.lat = req.body.lat * 1 + me._map_loc_random();

            // console.log(me.all.socket[data._id].all);

            return data.save();
          })
          .then(function(data) {
            res.send(data);

            // 通知所有人
            me._IO_emit_all_newUser_one({
              net_name: me.all.socket[data._id].all.net_name,
              _id: data._id,
              sex: me.all.socket[data._id].all.sex,
              info: "hi~大家好，我是" + me.all.socket[data._id].all.net_name,
              lng: me.all.socket[data._id].all.lng,
              lat: me.all.socket[data._id].all.lat,
            });

          });
      },
      // 跟新信息
      _upd_info: function(req, res) {
        // console.log(req.body);
        me.User_model
          .findById(req.body._id)
          .then(function(data) {
            // console.log(data, 1);

            // socket对象体信息变更
            me.all.socket[req.body._id].all.net_name = req.body.net_name;
            me.all.socket[req.body._id].all.sex = req.body.sex;

            // 数据库保存
            data.net_name = req.body.net_name;
            data.sex = req.body.sex;


            return data.save();
          })
          .then(function(data) {

            res.send(data);

            me._IO_emit_all_newInfo_one({
              net_name: me.all.socket[data._id].all.net_name,
              _id: data._id,
              sex: me.all.socket[data._id].all.sex,
              info: "我已经改名为" + me.all.socket[data._id].all.net_name,
              lng: me.all.socket[data._id].all.lng,
              lat: me.all.socket[data._id].all.lat,
              // 标识
              key: "upd",
            });

          });
      },






      // 大通道连接
      _IO_connect: function(cb) {
        me.io.on("connection", function(socket) {
          cb(socket);
        });
      },


      // ==========================================================服务器 收到 新的信息
      // 用户 初次进来时 ，先把socket 登记下；
      _one_newUser_init: function(socket) {
        //
        socket.on('one_newUser_init', function(data) {
          // 给注册过来的用户，登记一个空对象；
          me.all.socket[data._id] = {};

          // 赋值 当前的 socket 对象
          // 这个socket就有意思了，可以理解为客户端过来的socket
          // 这个socket可以在服务端，向这个客户端发送信息；
          me.all.socket[data._id].socket = socket;

          // 登记过来的信息，一开始什么都没有
          me.all.socket[data._id].all = data;

          // console.log(me.all.socket[data._id].all);
        });
      },
      // 信息登记
      _one_newUser_all: function(socket) {
        // 当前用户注册后台这个通道
        socket.on('one_newUser_all', function(data) {

          // 数据同步
          me.all.socket[data._id].all.net_name = data.net_name;
          me.all.socket[data._id].all._id = data._id;
          me.all.socket[data._id].all.sex = data.sex;
          me.all.socket[data._id].all.lng = data.lng;
          me.all.socket[data._id].all.lat = data.lat;

          // 新登记的人-->通知所有人
          me._IO_emit_all_newUser_one(data);

        });
      },
      // 随机定位值
      _map_loc_random: function() {
        return Math.random() > 0.5 ? Math.random() * 0.001 : -Math.random() * 0.001;
      },
      // 大通道通知所有用户
      // 下面 的 事件 可以理解为
      // 对比： 
      // me.io 发出的事件，是所有用户端都能收到的事件，单向
      // 用户连接上 后台的socket，可以接收用户发来的信息，也可以发送信息；双向；
      _IO_emit_all_newUser_one: function(data) {
        me.io.emit("all_newUser_one", data);
      },


      // ==========================================================服务器 收到 新的信息
      // 收到个人信息，给全部广播
      _one_newInfo_all: function(socket) {
        var obj = null;
        socket.on('one_newInfo_all', function(data) {
          // console.log(me.all.socket[data._id]);
          obj = {
            _id: data._id,
            net_name: me.all.socket[data._id].all.net_name,
            sex: me.all.socket[data._id].all.sex,
            info: data.info,
            lng: me.all.socket[data._id].all.lng,
            lat: me.all.socket[data._id].all.lat,
          };

          // console.log(obj);

          // 广播信息 给 每一个用户
          me._IO_emit_all_newInfo_one(obj);
        });
      },
      // 广播信息 给 每一个用户
      _IO_emit_all_newInfo_one: function(data) {
        me.io.emit("all_newInfo_one", data);
      },

      // ====================================服务器 收到 新的信息
      // 用户下线
      _one_userOut_all: function(socket) {
        var obj = null;
        socket.on('one_userOut_all', function(data) {
          // console.log(me.all.socket[data._id]);
          obj = {
            _id: data._id,
            net_name: me.all.socket[data._id].all.net_name,
            sex: me.all.socket[data._id].all.sex,
            info: `该用户已经下线`,
            // 标识为下线
            key: "out",
          };
          // 
          // 广播
          me._IO_emit_all_newInfo_one(obj);

          // 清空用户信息
          me.all.socket[data._id] = null;
        });
      },
      // 信息收到，给个人
      _one_newInfo_one: function(socket) {

        // 当前socket 
        socket.on('one_newInfo_one', function(data) {
          // console.log(data);
          // 
          data.from_net_name = me.all.socket[data.from].all.net_name;

          // 要接受对象的socket 发送信息 
          me.all.socket[data.to].socket.emit('allOne_newInfo_one', data);
        });
      },



    }

    for (var key in fns) {
      me[key] = fns[key];
    }
  },
};


module.exports = Module;
//