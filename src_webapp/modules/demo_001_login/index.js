(function($) {
  function Login() {
    var me = this;
    me.api = {
      // 
      reg: {
        url: '/api/user/reg.do',
      },

      login: {
        url: '/api/user/login.do',
      },


    };


    // 
    me.conf = {
      // 用于选择接口的切换
      api: me.api.login,
    };
  };
  Login.prototype = {
    init: function() {
      var me = this;

      // 线条
      Particles.init({
        selector: '#background',
        maxParticles: 100,
        color: '#ffffff',
        connectParticles: true
      });

      me._bind();


      // 页面初始化
      me._init();

    },
    _bind: function() {
      var me = this;
      var fns = {
        _init: function() {
          // window.sessionStorage.setItem(key, val);
          // ;
          // window.sessionStorage.removeItem(key);
          // 存在该用户
          if (window.sessionStorage.getItem("_id")) {
            window.location.href = '../demo_002_room/index.html';
          }
          // 
          else {
            // 入口
            me._sign();
          }
        },
        // 
        _sign: function() {
          // 检查常登陆
          // var _name = $.session.get('_name');
          // if (_name != undefined) {
          //   // me._chat_load_html();
          //   // return;
          // }


          $('#sign_in')
            .off()
            .on('click', function() {
              var str = `
                <div class='box' id='box'>
                  <input type="text" placeholder="name" class='name' id='name'>
                  <input type="password" placeholder="password" id='ps'>
                  <div class='yes' id='yes'></div>
                  <div class='item login ac' id="login"></div>
                  <div class='item reg' id="reg"></div>
                </div>
                `;

              // 弹窗
              layer.open({
                type: 1,
                title: false,
                area: ['270px', '65px'],
                skin: 'cc_layer',
                anim: 1,
                shade: 0.6,
                // closeBtn: 0,
                shadeClose: false, //点击遮罩关闭
                btn: false,
                content: str,
                success: function(layero, index) {
                  // 
                  me._nav();

                  // 
                  me._yes(index);
                },
              });
            });
        },
        _nav: function() {
          // 选择提示信息
          me._nav_info("login");
          $('#box')
            .off()
            .on('mouseover', '.item', function(e) {
              me._nav_info($(e.target).attr('id'));
            })
            .on('click', '.item', function(e) {
              $('#box>.item').removeClass("ac");
              $(e.target).addClass('ac');

              me.conf.api = me.api[$(e.target).attr('id')];
              // console.log(me.conf.api);
            });
        },
        // 选择提示信息
        _nav_info: function(_id) {
          layer.tips((_id == 'login' ? '登录' : '注册'), `#${_id}`, {
            tips: [4, '#1E9FFF']
          });
        },


        // 
        _yes: function(index) {
          $('#yes')
            .off()
            .on('click', function() {
              if ($('#name').val() == '') {
                layer.msg('name 不能为空');
                return;
              }
              if ($('#name').val().length > 10) {
                layer.msg('name长度不能超过10个字符');
                return;
              }

              if ($('#ps').val() == '') {
                layer.msg('密码不能为空');
                return;
              }
              if ($('#ps').val().length > 10) {
                layer.msg('密码长度不能超过10个字符');
                return;
              }

              me.conf.api.data = {
                name: $('#name').val(),
                ps: $('#ps').val(),
              };
              FN.ajax(me.conf.api)
                .done(function(data) {
                  // console.log(data);
                  me._yes_done(data, index);
                });

            });
        },
        // api成功
        _yes_done: function(data, index) {

          // 登录，注册成功
          if (data._id) {
            layer.close(index);
            window.sessionStorage.setItem("_id", data._id);
            
            // 注册成功后，重新进行一次初始化
            me._init();
          }
          // 有问题
          else {
            layer.msg(data.desc);
          }
        },


      };
      for (var key in fns) {
        me[key] = fns[key];
      }
    },

  };
  window.Login = Login;
})(jQuery);