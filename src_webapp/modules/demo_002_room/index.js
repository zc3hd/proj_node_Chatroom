(function($) {
  function Model() {
    var me = this;
    me.api = {
      // 找用户信息
      find: {
        url: '/api/user/find.do',
      },

      // upd信息
      upd_info: {
        url: '/api/user/upd_info.do',
      },

      // upd信息
      upd_ps: {
        url: '/api/user/upd_ps.do',
      },
    };

    // 
    me.all = {
      // 回车事件触发对象标识
      enter_key: '',
      // 当前登录的用户对象
      user_obj: null,
      // ===========================全局聊天区的配置
      // content的卷入高度
      top: 0,
      // 条数限制
      num: 50,

      // ===========================私信聊天的用户对象
      users: {},
      // 限制为
      _num: 20,

      // ============================地图相关
      map: {
        // 定位工具
        tool: null,
        // 定位
        lng: 116.34572,
        lat: 39.97691,
      },

      // ============================用户定位相关
      loc_key: null,
    };



    // 当前socket
    me.io = io();
  };
  Model.prototype = {
    init: function() {
      var me = this;

      // 
      me._bind();

      // DOM事件
      me.ev();

      // 接受大管道的事件 通道这种东西，只能绑定一次
      me._receiveIO();

      // 加载地图
      me._map(function() {
        // 初始化验证
        me._user_check();
      });
    },
    _bind: function() {
      var me = this;
      var fns = {
        _map: function(cb) {
          me.map = new AMap.Map("map", {
            mapStyle: 'amap://styles/macaron',
          });
          // 加载工具
          me._map_tool()
            .then(function(data) {
              console.log(data);
              return me._map_loc()
            })
            .then(function (data) {
              console.log(data);
              cb&&cb();
            });

        },
        _map_tool: function() {
          return newleHighAccuracy: false, //是否使用高精度定位，默认:true
                timeout: 10000, //超过10秒后停止定位，默认：5s Promise(function(resolve, reject) {
            AMap.plugin('AMap.Geolocation', function() {
              me.all.map.tool = new AMap.Geolocation({
                enab
                buttonPosition: 'RT', //定位按钮的停靠位置
                buttonOffset: new AMap.Pixel(10, 10), //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                zoomToAccuracy: false, //定位成功后是否自动调整地图视野到定位点
                showMarker: false,
              });
              me.map.addControl(me.all.map.tool);
              // loc_fn && loc_fn();
              resolve("tool_init");
            });
          });

        },
        // 浏览器定位
        _map_loc: function() {
          return new Promise(function(resolve, reject) {
            me.all.map.tool.getCurrentPosition(function(status, result) {
              // console.log(result);
              if (status == 'complete') {
                me.all.map.lng = result.position.lng;
                me.all.map.lat = result.position.lat;

                // 可以定位
                me.all.loc_key = true;
              }
              // 
              else {

                // 不能定位
                me.all.loc_key = false;
                // 
                layer.msg('浏览器不支持定位，您的默认位置为北京');
                me.all.map.lng = me.all.map.lng + (Math.random() > 0.5 ? Math.random() : -Math.random());
                me.all.map.lat = me.all.map.lat + (Math.random() > 0.5 ? Math.random() : -Math.random());
              }

              // cb && cb();
              resolve("loc_init");

            });
          });

        },
        // 用户marker
        _map_user: function() {
          var marker = new AMap.Marker({
            // icon: "http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
            position: [me.all.user_obj.lng, me.all.user_obj.lat],
            offset: new AMap.Pixel(-15, 0),
            icon: new AMap.Icon({
              size: new AMap.Size(30, 30), //图标大小
              imageSize: new AMap.Size(30, 30),
              image: `./img/map_${me.all.user_obj.sex}.png`,
              // imageOffset: new AMap.Pixel(5, 5)
            }),
          });

          marker.setMap(me.map);

          console.log(marker);
          // var markerContent = '' +
          //   '<div class="custom-content-marker">' +
          //   '   <img src="//a.amap.com/jsapi_demos/static/demo-center/icons/dir-via-marker.png">' +
          //   '   <div class="close-btn" onclick="clearMarker()">X</div>' +
          //   '</div>';

          // var marker = new AMap.Marker({
          //   position: position,
          //   // 将 html 传给 content
          //   content: markerContent,
          //   // 以 icon 的 [center bottom] 为原点
          //   offset: new AMap.Pixel(-13, -30)
          // });
        },





        // =========================================================所有的DOM事件
        // DOM事件
        ev: function() {
          // 回车信息
          me.ev_enter();
          // 
          // 信息修改
          me.ev_upd_info();
          // 修改密码
          me.ev_upd_ps();
          // 退出
          me.ev_out();
          // 聊天
          me.ev_common();
        },
        // =========================================
        // 键盘键入信息
        ev_enter: function() {
          // 回车
          $(document)
            .off()
            .on('keydown', function(e) {
              if (e.keyCode != 13) {
                return;
              }
              if (me.all.enter_key == '') {
                return;
              }
              $(`#${me.all.enter_key}`).click();
            });
        },
        // ==========================================
        // 初始化和后期修改信息的弹窗
        // 
        ev_upd_info_layer: function(closeBtn) {
          var str = `
                <div class='box' id='box'>
                  <div class='my_info'>
                    <div class='title'>昵称</div>
                    <div class='ipt'>
                      <input type="text" id='net_name'>
                    </div>
                  </div>

                  <div class='my_info'>
                    <div class='title'>性别</div>
                    <div class='ipt'>
                      <select name="" id="sex">
                        <option value=1>boy</option>
                        <option value=0>girl</option>
                      </select>
                    </div>
                  </div>

                  <div class='yes' id='info_yes'></div>
                </div>
                `;

          // 弹窗
          layer.open({
            type: 1,
            title: false,
            area: ['270px', '80px'],
            skin: 'cc_layer',
            anim: 1,
            shade: 0.6,
            closeBtn: closeBtn,
            shadeClose: false, //点击遮罩关闭
            btn: false,
            content: str,
            success: function(layero, index) {
              // 有数据了
              if (me.all.user_obj != null) {
                $('#net_name').val(me.all.user_obj.net_name);
                $('#sex').val(me.all.user_obj.sex);
              }

              $('#info_yes')
                .on('click', function() {
                  me.ev_upd_info_layer_yes(index);
                });
            },
          });
        },
        // 提交数据
        ev_upd_info_layer_yes: function(index) {
          if ($('#net_name').val() == '') {
            layer.msg('昵称不能为空');
            return;
          }
          if ($('#net_name').val().length > 10) {
            layer.msg('昵称长度不能超过10个字符');
            return;
          }
          me.api.upd_info.data = {
            _id: window.sessionStorage.getItem("_id"),
            net_name: $('#net_name').val(),
            sex: $('#sex').val()
          }
          FN.ajax(me.api.upd_info)
            .then(function(data) {
              // me.all.user_obj = data;
              // // 其他信息登记
              // me._io_emit_id_info(me.all.user_obj);

              layer.close(index);

              // 再次初始化
              me._init();
            });
        },
        // ==========================================
        // 修改个人信息
        ev_upd_info: function() {

          // 事件
          $('#upd_info')
            .off()
            .on('click', function() {
              me.ev_upd_info_layer(1);
            });
        },
        // 修改密码
        ev_upd_ps: function() {
          $('#upd_ps')
            .off()
            .on('click', function() {
              var str = `
                <div class='box' id='box'>

                  <div class='my_info'>
                    <div class='title'>新密码</div>
                    <div class='ipt'>
                      <input type="text" id='ps'>
                    </div>
                  </div>

                  <div class='yes' id='upd_yes'></div>
                </div>
                `;

              // 弹窗
              layer.open({
                type: 1,
                title: false,
                area: ['270px', '40px'],
                skin: 'cc_layer',
                anim: 1,
                shade: 0.6,
                // closeBtn: 0,
                shadeClose: false, //点击遮罩关闭
                btn: false,
                content: str,
                success: function(layero, index) {

                  $('#upd_yes')
                    .on('click', function() {
                      // 
                      if ($('#ps').val() == '') {
                        layer.msg('新密码不能为空');
                        return;
                      }
                      if ($('#ps').val().length > 10) {
                        layer.msg('密码长度不能超过10个字符');
                        return;
                      }

                      me.api.upd_ps.data = {
                        _id: window.sessionStorage.getItem("_id"),
                        ps: $('#ps').val(),
                      };
                      FN.ajax(me.api.upd_ps)
                        .then(function(data) {
                          if (data.ret == 1) {
                            layer.msg('密码修改成功');
                            layer.close(index);
                          }
                        });

                    });
                },
              });
            });
        },
        // 退出
        ev_out: function() {
          $('#out')
            .off()
            .on('click', function() {
              var str = `
                <div class='box' id='box'>
                  <div class='out_info'>亲,一定要退出么?</div>
                  <div class='yes' id='out_yes'></div>
                </div>
                `;

              // 弹窗
              layer.open({
                type: 1,
                title: false,
                area: ['270px', '60px'],
                skin: 'cc_layer',
                anim: 1,
                shade: 0.6,
                // closeBtn: 0,
                shadeClose: false, //点击遮罩关闭
                btn: false,
                content: str,
                success: function(layero, index) {

                  $('#out_yes')
                    .on('click', function() {
                      layer.close(index);
                      // 退出
                      me._io_emit_id_out({ _id: window.sessionStorage.getItem("_id") });

                      // 
                      window.sessionStorage.removeItem("_id");
                      me._init();
                    });
                },
              });
            });
        },
        // ==========================================
        // 公共聊天
        ev_common: function() {
          // 折叠
          me.ev_common_view();

          // 滚动条
          $('#content').niceScroll({
            cursorcolor: '#ccc',
            autohidemode: false,
            cursorborder: '0px solid blue'
          });

          // 输入信息
          me.ev_common_info_send();

          // 私聊
          me.ev_common_to_one();
        },
        // 折叠
        ev_common_view: function() {
          $('#view')
            .on('click', function() {
              // kai--->guan
              if ($('#view').attr('key') == 1) {
                $('#view')
                  .attr('key', 0)
                  .removeClass('hide')
                  .addClass('show');


                $('#list').css('left', '-260px');
                $('#ipt_box_f').css('padding-left', 0);
              }
              // guan---kai
              else {
                $('#view')
                  .attr('key', 1)
                  .removeClass('show')
                  .addClass('hide');

                $('#list').css('left', 0);
                $('#ipt_box_f').css('padding-left', '260px');



              }
            });
        },
        // 新消息
        ev_common_new: function() {

          $('#content').append(`
          <div class="item item_${chat_data.sex}">

            <div class="head" _id=${chat_data._id}>
              <div class="img">
                <div class="arrow"></div>
              </div>
              <div class="name">${chat_data.net_name}</div>
            </div>

            <div class="info_box">
              <div class="info">${chat_data.info}</div>
            </div>
            
          </div>
          `);

          // 
          if (($('#content>.item:last .info').height() + 12 + 5) > 50) {
            $('#content>.item:last').css('height', $('#content>.item:last .info').height() + 12 + 10 + 'px');
          }


          // 
          if ($('#content>.item:last').offset().top - 40 + $('#content>.item:last').height() > $('#content').height()) {
            me.all.top = me.all.top + $('#content>.item:last').offset().top - 40 + $('#content>.item:last').height() - $('#content').height();

          }


          // 条数限制
          if ($('#content>.item').length > me.all.num) {
            me.all.top = me.all.top - $('#content>.item:first').height();
            $('#content>.item:first').remove();
          }

          $("#content").animate({
            scrollTop: me.all.top
          });
        },
        // 输入信息
        ev_common_info_send: function() {
          $('#enter')
            .off()
            .on('click', function() {
              if ($('#new_ipt').val() == '') {
                return;
              }
              // 发出信息
              me._io_emit_new_info({
                _id: window.sessionStorage.getItem("_id"),
                info: $('#new_ipt').val()
              });


              // 时刻定位相关

              $('#new_ipt').val("");
            });

          // 注入中确认回车的标识
          $('#new_ipt')
            .off()
            .on('input', function() {
              me.all.enter_key = 'enter';
            });
        },
        // 公屏上的定位相关
        ev_common_loc: function() {
          // 
          if (me.all.loc_key) {

          }
        },
        // ==========================================
        // 公共选择一个进入私聊
        ev_common_to_one: function() {

          $('#content')
            .off()
            .on('click', '.head', function(e) {

              if ($(e.currentTarget).attr('_id') == undefined) {
                layer.msg('当前用户不能发起聊天');
                return;
              }
              if ($(e.currentTarget).attr('_id') == me.all.user_obj._id) {
                layer.msg('不能与自己聊天');
                return;
              }

              // 创建私信的数据包
              one_data._id = $(e.currentTarget).attr('_id');
              one_data.net_name = $(e.currentTarget).find('.name').html();
              one_data.info = '';

              // 发起单个聊天
              me.ev_one();
            });
        },
        // ==========================================
        // 单个聊天
        ev_one: function() {
          // 第一次
          if (me.all.users[one_data._id] == undefined) {
            // 
            me.all.users[one_data._id] = {
              // 组合ID
              ID: "",
              // 推来的id
              _id: "",
              // 弹窗层级
              index: -1,
              // 数据包
              all: null,
              // 上卷高度
              top: 0,
            };

            // 登记
            me.all.users[one_data._id]._id = `${one_data._id}`;
            me.all.users[one_data._id].ID = `${one_data._id}_${window.sessionStorage.getItem("_id")}`;
            me.all.users[one_data._id].all = one_data;

            // 新信息弹窗
            me.ev_one_info(me.all.users[one_data._id].ID, one_data._id);
          }
          // 下一次信息
          else {
            me.all.users[one_data._id].all = one_data;

            // 推信息
            me.ev_one_info_new(me.all.users[one_data._id].ID, one_data._id, me.all.users[one_data._id].all);
          }
        },
        // 新弹窗
        ev_one_info: function(ID, _id) {

          var str = `
          <div class='new_info_box' id='${ID}_box'>
            
            <div class='title'>
              与 ${me.all.users[_id].all.net_name} 的私聊
            </div>

            <div class='content' id='${ID}_content'>

            </div>
            
            <div class='ipt_box'>

              <div class='ipt'>
                <input type="text" id='${ID}_ipt'>
              </div>

              <div class='btn' id='${ID}_send'>send</div>
            </div>

          </div>
          `;

          // 弹窗
          layer.open({
            type: 1,
            title: false,
            move: '.title',
            area: ['350px', '300px'],
            skin: 'cc_layer',
            anim: 1,
            shade: 0,
            shadeClose: false, //点击遮罩关闭
            btn: false,
            content: str,
            success: function(layero, index) {
              // 滚动条
              $(`#${ID}_content`).niceScroll({
                cursorcolor: '#ccc',
                autohidemode: false,
                cursorborder: '0px solid blue'
              });

              // 层级
              me.all.users[_id].index = index;

              // 新信息到来
              me.ev_one_info_new(ID, _id, me.all.users[_id].all);

              // 发送地信息时间
              me.ev_one_info_send(ID, _id);
            },
            cancel: function(index, layero) {
              me.all.users[_id] = undefined;
            }
          });
        },
        // 发送-新消息
        ev_one_info_send: function(ID, _id) {
          $(`#${ID}_send`)
            .off()
            .on('click', function() {
              if ($(`#${ID}_ipt`).val() == '') {
                return;
              }

              // 本地 写显示 刚才的 信息
              me.ev_one_info_new(ID, _id, {
                _id: window.sessionStorage.getItem("_id"),
                net_name: me.all.user_obj.net_name,
                info: $(`#${ID}_ipt`).val()
              });


              // 远程：发送数据包
              me._io_emit_new_info_one({
                from: window.sessionStorage.getItem("_id"),
                to: _id,
                info: $(`#${ID}_ipt`).val()
              });

              // 
              $(`#${ID}_ipt`).val("");
            });

          $(`#${ID}_ipt`)
            .off()
            .on('input', function() {
              me.all.enter_key = `${ID}_send`;
            });
        },
        // 接受-新消息
        ev_one_info_new: function(ID, _id, data) {
          if (data.info == '') {
            return;
          }


          $(`#${ID}_content`)
            .append(`
              <div class="${(data._id==window.sessionStorage.getItem("_id")?'item_me':'item')}">
                <div class="head">${data.net_name}</div>
                <div class="info_box">
                  <div class="info">${data.info}</div>
                </div>
              </div>`);

          // 
          var info_h = $(`#${ID}_content>div:last .info`).height();
          // dom的高
          var dom_h = $(`#${ID}_content>div:last`).height();
          if (info_h + 10 > 30) {
            $(`#${ID}_content>div:last`).css('height', info_h + 10 + 'px');
            dom_h = info_h + 10;
          }

          // dom的绝对定位
          var dom_top = $(`#${ID}_content>div:last`).offset().top;

          // 盒子的绝对定位
          var box_top = $(`#${ID}_box`).offset().top;
          var box_h = $(`#${ID}_box`).height() + 30;

          // console.log((dom_top + dom_h), (box_top + box_h))
          // 高度超出
          if ((dom_top + dom_h) > (box_top + box_h)) {
            me.all.users[_id].top = me.all.users[_id].top + dom_top + dom_h - box_top - box_h;
          }
          // 


          // 条数限制
          if ($(`#${ID}_content>div`).length > me.all._num) {
            me.all.users[_id].top = me.all.users[_id].top - $('#content>div:first').height();
            $(`#${ID}_content>div:first`).remove();
          }

          $(`#${ID}_content`)
            .animate({
              scrollTop: me.all.users[_id].top
            });

          // 
          info_h = dom_h = dom_top = box_top = box_h = null;
        },



        // ============================================发出的全是自己的管道
        // 信息登记
        _io_emit_id_info: function(data) {
          me.io.emit('id_info', data);
        },
        // 新的消息到全部用户
        _io_emit_new_info: function(data) {
          me.io.emit('new_info', data);
        },
        // 下线
        _io_emit_id_out: function(data) {
          me.io.emit('id_out', data);
        },
        // 发送给某个用户的数据
        _io_emit_new_info_one: function(data) {
          me.io.emit('new_info_one', data);
        },







        // ============================================接受的全是大管道
        _receiveIO: function() {
          // 
          me._receiveIO_new_user();
          // 接受大管道：全体新信息
          me._receiveIO_new_info();
          // 接受单个信息
          me._receiveIO_new_info_one();
        },
        // 接受大管道：通知所有用户：新用户来到通知
        _receiveIO_new_user: function() {
          me.io.on("new_user", function(data) {

            // 
            chat_data = data;
            chat_data.info = `hi~ 我是${data.net_name}，很高兴认识大家~`;

            // 推入公共区域新信息
            me.ev_common_new();


          });
        },
        // 接受大管道：用户新信息
        _receiveIO_new_info: function() {
          // 
          me.io.on("all_new_info", function(data) {
            chat_data = data;
            // 下线也会通知到公屏上；
            me.ev_common_new();
          });
        },
        // 接受大管道的信息：个人信息：
        _receiveIO_new_info_one: function() {
          me.io.on("new_info_one", function(data) {
            // console.log(data);

            // 创建私信的数据包
            one_data._id = data.from;
            one_data.net_name = data.from_net_name;
            one_data.info = data.info;

            // 发起单个聊天
            me.ev_one();
          });
        },


        // ================================================初始化信息验证
        _user_check: function() {
          // 存在该用户
          if (window.sessionStorage.getItem("_id")) {

            // 信息初始化
            me._user_check_init();

          }
          // 没有ID，就退出
          else {
            window.location.href = '../demo_001_login/index.html';
          }
        },
        // 个人信息初始化验证
        _user_check_init: function(cb) {
          // 
          me.api.find.data = {
            _id: window.sessionStorage.getItem("_id")
          };
          FN.ajax(me.api.find)
            .then(function(data) {

              // 没有数据
              if (data.net_name == '' || data.net_name == undefined) {
                me.ev_upd_info_layer(0);
                return;
              }
              // 有数据
              me.all.user_obj = data;
              me.all.user_obj.lng = me.all.map.lng;
              me.all.user_obj.lat = me.all.map.lat;

              // ID信息登记
              me._io_emit_id_info(me.all.user_obj);

              // 用户定位
              me._map_user();
            });
        },

      };
      for (var key in fns) {
        me[key] = fns[key];
      }
    },

  };
  window.Model = Model;
})(jQuery);
