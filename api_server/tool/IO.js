// 全局工具函数
var FN = require('./common.js');



function Module(io) {
  var me = this;
  me.io = io;

  me.all = {
    // 所有的通道
    socket: {

    },
  }

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
  },
  _bind: function() {
    var me = this;
    var fns = {
      // 大通道连接
      _IO_connect: function(cb) {
        me.io.on("connection", function(socket) {
          cb(socket);
        });
      },

      // =====================================大管道的所有注册的事件
      // 大通道通知所有连接
      _IO_emit_new_user: function(data) {
        me.io.emit("new_user", data);
      },
      // 大通道通知所有连接
      _IO_emit_new_info: function(data) {
        me.io.emit("all_new_info", data);
      },


      // =====================================当前连接的注册的管道
      // 信息登记
      _id_info: function(socket) {
        socket.on('id_info', function(data) {

          me.all.socket[data._id] = {};
          me.all.socket[data._id].socket = socket;
          me.all.socket[data._id].all = data;



          // 新登记的人-->通知所有人
          me._IO_emit_new_user(data);
        });
      },
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
          };
          // console.log(obj);
          // 通知新
          me._IO_emit_new_info(obj);
        });
      },
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
          };
          // 
          // 通知
          me._IO_emit_new_info(obj);

          // 删除属性
          // me.all.socket[data._id] = null;
        });
      },
      //  信息收到，给个人
      _new_info_one: function(socket) {

        socket.on('new_info_one', function(data) {
          // console.log(data);
          data.from_net_name = me.all.socket[data.from].all.net_name;
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
