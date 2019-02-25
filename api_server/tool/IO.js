// 全局工具函数
var FN = require('./common.js');



function Module(io, app) {
  var me = this;
  me.io = io;

  // 
  me.app = app;
  // 路由
  me.router = require('express').Router();

  // 收集所有通道
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

    // 连接
    me._IO_connect(function(socket) {
      // 所有的事件只能在当前socket注册事件

      // 身份信息登记
      me._id_info(socket);

      // 新信息
      me._new_info(socket);

      // 用户下线
      me._id_out(socket);


      // 新信息给个人
      me._new_info_one(socket);
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
      // 保存位置
      _save_loc: function(req, res) {
        var me = this;
        me.User_model
          .findById(req.body._id)
          .then(function(data) {

            data.lng = req.body.lng;
            data.lat = req.body.lat;

            return data.save();
          })
          .then(function(data) {
            res.send(data);
          });
      },
      // 跟新信息
      _upd_info: function(req, res) {
        me.User_model
          .findById(req.body._id)
          .then(function(data) {
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
          });
      },






      // 大通道连接
      _IO_connect: function(cb) {
        me.io.on("connection", function(socket) {
          cb(socket);
        });
      },


      // ====================================服务器 收到 新的信息
      // 信息登记
      _id_info: function(socket) {
        socket.on('id_info', function(data) {
          // console.log(data);
          me.all.socket[data._id] = {};
          // 这个socket就有意思了，可以理解为客户端过来的socket
          // 这个socket就是可以在服务端，向这个客户端发送信息；
          me.all.socket[data._id].socket = socket;


          // 登记过来的信息；
          data.lng = data.lng + me._map_loc_random();
          data.lat = data.lat + me._map_loc_random();
          me.all.socket[data._id].all = data;

          me.User_model
            .findById(data._id)
            .then(function(user) {

              user.lng = data.lng;
              user.lat = data.lat;

              // user_data = user;
              // console.log(user_data);
              return user.save();
            })
            .then(function() {

              // 新登记的人-->通知所有人
              me._IO_emit_new_user(data);
            });

        });
      },
      // 随机定位值
      _map_loc_random: function() {
        return Math.random() > 0.5 ? Math.random() * 0.001 : -Math.random() * 0.001;
      },
      // 大通道通知所有连接
      _IO_emit_new_user: function(data) {
        me.io.emit("new_user", data);
      },


      // ====================================服务器 收到 新的信息
      // 信息收到，给全部
      _new_info: function(socket) {
        var obj = null;
        socket.on('new_info', function(data) {
          // console.log(me.all.socket[data._id]);
          obj = {
            net_name: me.all.socket[data._id].all.net_name,
            _id: data._id,
            sex: me.all.socket[data._id].all.sex,
            info: data.info,
            lng:me.all.socket[data._id].all.lng,
            lat:me.all.socket[data._id].all.lat,
          };
          // console.log(obj);
          // 通知新
          me._IO_emit_new_info(obj);
        });
      },
      // 大通道通知所有连接
      _IO_emit_new_info: function(data) {
        me.io.emit("all_new_info", data);
      },

      // ====================================服务器 收到 新的信息
      // 用户下线
      _id_out: function(socket) {
        var obj = null;
        socket.on('id_out', function(data) {
          // console.log(me.all.socket[data._id]);
          obj = {
            _id: data._id,
            net_name: me.all.socket[data._id].all.net_name,
            sex: me.all.socket[data._id].all.sex,
            info: `该用户已经下线`,
            // 标识为下线
            key:"out",
          };
          // 
          // 通知
          me._IO_emit_new_info(obj);

          // 删除属性
          // me.all.socket[data._id] = null;
        });
      },
      // 信息收到，给个人
      _new_info_one: function(socket) {

        socket.on('new_info_one', function(data) {
          // console.log(data);
          data.from_net_name = me.all.socket[data.from].all.net_name;

          // 要接受对象的
          me.all.socket[data.to].socket.emit('new_info_one', data);
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
