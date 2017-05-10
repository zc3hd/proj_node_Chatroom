(function($) {
  function Talk() {
    this.api = new API();
    this.socket = io();
  };
  Talk.prototype = {
    init: function() {
      var me = this;
      me._pre_sign();
      // 退出函数
      me.sign_out();
      // 登陆
      me.sign_in();
      me.key_down();

    },
    _pre_sign: function() {
      var me = this;
      var _name = $.session.get('name');

      // 常登陆状态
      if (_name != undefined) {

        $('#one_p').hide();
        $('.area').show();
        $('.ipt').show();
        $('#topbar').html('欢迎' + _name + ',点击此处进行退出~~');
      }
    },
    sign_out: function() {
      var me = this;
      $('#topbar').on('click', function() {
        $('#one_p').show();
        $('.area').hide().html('');
        $('.ipt').hide();
        $('#topbar').html('welcome to this chat_room');
        $('#name').val('');

        $.session.remove('name');
      });
    },
    sign_in: function() {
      var me = this;

      $('#btn').on('click', function() {
        var _name = $('#name').val();

        me.api.sign_in({ name: _name })
          .done(function(data) {
            me.sign_in_done(data, _name);
          });
      });
    },
    sign_in_done: function(data, name) {
      var me = this;
      // 用户不存在--进入聊天室
      if (data.ret == 0) {
        $('#one_p').hide();
        $('.area').show();
        $('.ipt').show();

        $.session.set('name', name);
        $('#topbar').html('欢迎' + name + '~ 点击此处进行退出~~');
      }
      // 用户存在
      else {
        alert('用户存在');
        $('#name').val('');
      }
    },
    key_down: function() {
      var me = this;
      $(document).on('keydown', function(e) {
        if (e.keyCode == 13) {
          if ($('#item').val() == '') {
            return;
          }
          // 发出信息
          me.socket.emit('talk', {
            name: $.session.get('name'),
            info: $('#item').val()
          });
          $('#item').val('');


        }
      });
      
      // 这个是注册事件呢。
      me.socket.on("talk", function(obj) {

        var str = '' +
          '<span class="item">' +
          obj.name +
          '：' +
          obj.info +
          '</span>'
        $('.area').append(str);

        // 当前span的个数
        var acyive_sum = $('.area>span').length;

        // span的上限个数
        var H = $('.area').height();
        var limit_sum = Math.floor(H/30);
        
        if(acyive_sum>limit_sum){
          $('.area').scrollTop(acyive_sum*30-H);
        }

      });

      // $('.area').on('scroll',function () {
      //   console.log($('.area').scrollTop());
      // });
    },
  };
  window.Talk = Talk;
})(jQuery);
