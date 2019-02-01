// 全局工具函数
var FN = require('../tool/common.js');

function Module(app) {
  var me = this;

  // 
  me.app = app;
  // 路由
  me.router = require('express').Router();

  // 模型
  me.User_model = require('../collection/user.js');
}
Module.prototype = {
  init: function() {
    var me = this;

    // 配置前缀
    me.api_pro = '/api/user';

    // reg
    me.router.post('/reg.do', function(req, res) {
      me._reg(req, res);
    });

    // login
    me.router.post('/login.do', function(req, res) {
      me._login(req, res);
    });

    // find
    me.router.post('/find.do', function(req, res) {
      me._find(req, res);
    });

    // upd_info
    me.router.post('/upd_info.do', function(req, res) {
      me._upd_info(req, res);
    });

    // upd_ps
    me.router.post('/upd_ps.do', function(req, res) {
      me._upd_ps(req, res);
    });

    me.app.use(me.api_pro, me.router);
  },
  // 注册
  _reg: function(req, res) {
    var me = this;

    me.User_model
      .create({
        name: req.body.name,
        ps: req.body.ps,
      })
      .then(function(data) {
        data.ret = 1;
        res.send(data);
      }, function(data) {
        res.send({
          res: -1,
          desc: "user again"
        });
      });
  },
  // 登录
  _login: function(req, res) {
    var me = this;
    // console.log(req.body);
    me.User_model
      .findOne({ name: req.body.name })
      .then(function(data) {

        // 没有这个用户
        if (data == null) {
          res.send({
            res: -1,
            desc: "no user"
          });
          return;
        }
        // console.log(data);
        // 密码不对
        if (data.ps != req.body.ps) {
          res.send({
            res: -1,
            desc: "wrong ps"
          });
          return;
        }

        // 登录成功
        res.send(data);
      });
  },
  // 
  _find: function(req, res) {
    var me = this;
    me.User_model
      .findById(req.body._id)
      .then(function(data) {
        res.send(data);
      });
  },
  _upd_info: function(req, res) {
    var me = this;
    me.User_model
      .findById(req.body._id)
      .then(function(data) {

        data.net_name = req.body.net_name;
        data.sex = req.body.sex;

        return data.save();
      })
      .then(function(data) {
        res.send(data);
      });
  },
  _upd_ps: function(req, res) {
    var me = this;
    me.User_model
      .findById(req.body._id)
      .then(function(data) {

        data.ps = req.body.ps;
        return data.save();
      })
      .then(function(data) {
        res.send({ret:1});
      });
  },
};



module.exports = Module;
