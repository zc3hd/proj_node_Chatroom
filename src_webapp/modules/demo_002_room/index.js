(function($) {
  function Model() {
    var me = this;

    // 所有api
    me.api = {
      // 找用户信息
      find: {
        url: '/api/user/find.do',
      },

      // upd信息
      upd_info: {
        url: '/api/user/upd_info.do',
      },

      // 保存坐标
      save_loc: {
        url: '/api/user/save_loc.do',
      },


      // upd信息
      upd_ps: {
        url: '/api/user/upd_ps.do',
      },
    };

    // 所有数据容器
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
      // 地图对象收集
      map_user: {

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

      // 接受大管道的事件 通道注册的事件只能绑定一次
      me._receive_IO();

      // 加载地图
      me._map();
    },
    _bind: function() {
      var me = this;
      var fns = {

        // 地图初始化
        _map: function() {

          // 存在该用户
          if (window.sessionStorage.getItem("_id")) {

            // 地图
            me.map = new AMap.Map("map", {
              mapStyle: 'amap://styles/macaron',
              zooms: [3, 20],
              zoom: 7,
            });

            // 遮照
            me.map._load_index = FN.load('用户地图数据获取中...');


            // 用户初始化注册socket
            me._io_emit_one_newUser_init({
              _id: window.sessionStorage.getItem("_id")
            });


            // 加载地图工具
            me._map_tool()
              .then(function(data) {
                // 浏览器开始定位
                return me._map_loc()
              })
              .then(function(data) {

                // 获取用户信息
                return me._user_check();
              })
              // 发送给后台
              .then(function(data) {

                // *****************测试
                // me.all.user_obj.net_name = '';


                // 没有昵称
                if (me.all.user_obj.net_name == '' || me.all.user_obj.net_name == undefined) {
                  me._user_init();
                }
                // 有昵称
                else {
                  me.all.user_obj.info = "hi~大家好，我是" + me.all.user_obj.net_name,
                    // ID信息登记,后台登记信息，广播给全部
                    me._io_emit_one_newUser_all(me.all.user_obj);
                }



              });
          }
          // 没有ID，就退出
          else {
            me._page_1();
          }
        },
        // 加载工具
        _map_tool: function() {
          return new Promise(function(resolve, reject) {
            AMap.plugin('AMap.Geolocation', function() {
              me.all.map.tool = new AMap.Geolocation({
                enableHighAccuracy: false, //是否使用高精度定位，默认:true
                timeout: 3000, //超过10秒后停止定位，默认：无穷大
                maximumAge: 0,
                showButton: false,
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
            me.all.map.tool
              .getCurrentPosition(function(status, result) {
                // console.log(result);
                if (status == 'complete') {
                  // console.log(me._map_loc_random());
                  me.all.map.lng = result.position.lng
                  me.all.map.lat = result.position.lat;

                  // 可以定位
                  me.all.loc_key = true;
                }
                // 
                else {

                  // 不能定位
                  me.all.loc_key = false;
                  // 
                  layer.msg('当前浏览器不支持定位，可使用最新IE浏览器，</br>开启定位功能进行体验。', {
                    time: 4000
                  });
                  me.all.map.lng = me.all.map.lng;
                  me.all.map.lat = me.all.map.lat;
                }

                // cb && cb();
                resolve("loc_init");

              });
          });
        },
        // 初始化信息验证
        _user_check: function() {

          // 本地做缓存
          if (window.sessionStorage.getItem("_id")) {
            // 信息初始化
            return new Promise(function(resolve, reject) {
              // 
              me.api.find.data = {
                _id: window.sessionStorage.getItem("_id")
              };
              FN.ajax(me.api.find)
                .then(function(data) {


                  // 有用户数据，更新用户的坐标；
                  me.all.user_obj = data;
                  me.all.user_obj.lng = me.all.map.lng;
                  me.all.user_obj.lat = me.all.map.lat;


                  // 关闭地图数据查询的弹窗
                  layer.close(me.map._load_index);

                  resolve();
                });
            });
          }
          // 没有ID
          else {
            me._page_1();
          }
        },
        // 用户没有昵称，初始化登记
        _user_init: function() {
          // 默认性别为男
          me.all.user_obj.sex = 1;
          me.all.user_obj.net_name = "";
          me.ev_upd_info_layer(0);
        },





        // =========================================================所有的DOM事件
        // DOM事件
        ev: function() {
          // 回车事件模拟
          me.ev_enter();

          // 单个信息发送，广播接受
          me.ev_common();
          // 
          // 信息修改
          me.ev_upd_info();

          // 修改密码
          me.ev_upd_ps();

          // 退出
          me.ev_out();


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
              // 发生按钮点击
              $(`#${me.all.enter_key}`).click();
            });
        },

        // ==========================================
        // 初始化和后期修改信息的弹窗
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
                      <select id="sex">
                        <option value=1 selected="selected">boy</option>
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
            // 1：有关闭按钮，那就是再次修改信息
            closeBtn: closeBtn,
            shadeClose: false, //点击遮罩关闭
            btn: false,
            content: str,
            success: function(layero, index) {

              // 数据反选
              if (me.all.user_obj != null) {
                $('#net_name').val(me.all.user_obj.net_name);
                $('#sex').val(me.all.user_obj.sex);
              }

              // 提交数据
              $('#info_yes')
                .off()
                .on('click', function() {
                  // console.log(1);
                  me.ev_upd_info_layer_yes(index, closeBtn);
                });
            },
          });
        },
        // 提交数据
        ev_upd_info_layer_yes: function(index, closeBtn) {
          if ($('#net_name').val() == '') {
            layer.msg('昵称不能为空');
            return;
          }
          if ($('#net_name').val().length > 10) {
            layer.msg('昵称长度不能超过10个字符');
            return;
          }



          var api = {};
          api.data = {
            _id: me.all.user_obj._id,
            net_name: $('#net_name').val(),
            sex: $('#sex').val(),
            lng: me.all.user_obj.lng,
            lat: me.all.user_obj.lat,
          };

          // console.log(api.data);

          // 用户初始化，没有昵称
          if (closeBtn == 0) {
            api.url = me.api.save_loc.url;
          }
          // 用户有昵称 更新数据
          else {
            api.url = me.api.upd_info.url;
          }


          // 提交 数据
          FN.ajax(api)
            .then(function(data) {
              // 
              layer.close(index);

              // 本地更新当前用户的信息
              me.all.user_obj = data;


              // 界面上看到的修改是通过广播的形式
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
                      // 
                      layer.close(index);

                      // 点击确认退出
                      me.ev_out_done();
                    });
                },
              });
            });
        },
        // 点击确认退出
        ev_out_done: function() {
          // 通知后台退出--要广播
          me._io_emit_one_userOut_all({ _id: window.sessionStorage.getItem("_id") });

          // 跳转;
          window.sessionStorage.removeItem("_id");
          me._page_1();
        },


        // ==========================================


        // 公屏有新用户marker的新信息
        _marker_user_info: function(chat_data) {
          // 可能要初始化这个用户点，
          me._marker_user_make(chat_data);

          // marke头上的聊天大盒子
          $(`#mk_box_${chat_data._id}`).show();

          // marke头上的聊天大盒子 聊天的信息
          $(`#mk_${chat_data._id}>.info`).html(chat_data.info);

          // 消息框自动消失
          setTimeout(function() {
            $(`#mk_box_${chat_data._id}`).hide();
            // 清除
            chat_data = null;
          }, 3500);
        },
        // 公屏有新用户marker
        _marker_user_make: function(chat_data) {
          // 没有这个用户mk
          if (!me.all.map_user[chat_data._id]) {
            var marker = new AMap.Marker({
              position: [chat_data.lng, chat_data.lat],
              offset: new AMap.Pixel(-15, -30),
              icon: new AMap.Icon({
                size: new AMap.Size(30, 30), //图标大小
                imageSize: new AMap.Size(30, 30),
                image: `./img/map_${chat_data.sex}.png`,
              }),
            });
            marker.setMap(me.map);


            // 打label
            marker.setLabel({
              offset: new AMap.Pixel(0, 0),
              content: `<div class='marker_box marker_box_${chat_data.sex}' id="mk_box_${chat_data._id}">
                          <div class="item" id='mk_${chat_data._id}'>
                            <div class='net_name' id='mk_net_name_${chat_data._id}'>${chat_data.net_name}</div>
                            <div class='info'>${chat_data.info}</div>
                          </div>
                          <div class="arrow"></div>
                        </div>
                        <div class="marker_name" id='mk_net_name_${chat_data._id}_show'>${chat_data.net_name}</div>
                        `
            });

            // chat_data就是 广播 回来的数据包
            // 收集 用户点；
            me.all.map_user[chat_data._id] = marker;


            // 最优视角 判断ID是否是当前用户
            if (chat_data._id == window.sessionStorage.getItem("_id")) {
              me.map.setFitView([marker]);
            }

            // 清除
            marker = null;
          }
          // 清除
          chat_data = null;
        },




        // 用户的信息改变，地图点的跟变
        _marker_user_upd: function(chat_data) {
          // console.log(chat_data);
          // 列表所有昵称进行重新赋值；
          $(`#content .head[_id=${chat_data._id}]>.name`).html(chat_data.net_name);
          // 昵称颜色
          $(`#content .head[_id=${chat_data._id}]`).parent().removeClass().addClass(`item item_${chat_data.sex}`);


          // 地图的点的聊天的昵称改变
          $(`#mk_net_name_${chat_data._id}`).html(chat_data.net_name);
          // 地图常显示的网名改变
          $(`#mk_net_name_${chat_data._id}_show`).html(chat_data.net_name);


          // 列表的性别
          $(`#content .head[_id=${chat_data._id}]>.img`).css({
            "background": `url(./img/${chat_data.sex}.png)`,
            "background-repeat": "no-repeat",
            "background-position": "50%",
            "background-size": "26px",
          });


          // marker点性别改变
          $(`#mk_box_${chat_data._id}`)
            .parent()
            .parent()
            .children('.amap-icon')
            .children('img')
            .attr('src', `./img/map_${chat_data.sex}.png`);





          // console.log(chat_data);
          // 
          chat_data = null;
        },
        // 公屏用户点离线的地图清除
        _marker_user_out: function(chat_data) {
          // 清除图点点；
          me.map.remove(me.all.map_user[chat_data._id]);

          // 清除marker的收集；
          me.all.map_user[chat_data._id] = null;
          // 
          chat_data = null;


        },





        // ============================================================
        // 公共聊天
        ev_common: function() {
          // 公共信息框折叠
          me.ev_common_view();

          // 滚动条
          $('#content').niceScroll({
            cursorcolor: '#ccc',
            autohidemode: false,
            cursorborder: '0px solid blue'
          });

          // 公屏输入信息ing  发送ev
          me.ev_common_one_newInfo_all();

          // 点击头像进入私聊
          me.ev_common_one_newInfo_one();
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
        // 输入信息 发送
        ev_common_one_newInfo_all: function() {
          $('#enter')
            .off()
            .on('click', function() {
              if ($('#new_ipt').val() == '') {
                return;
              }
              // 发出信息
              me._io_emit_one_newInfo_all({
                _id: window.sessionStorage.getItem("_id"),
                info: $('#new_ipt').val()
              });

              // 清空
              $('#new_ipt').val("");
            });


          // 保证是公屏的input框在一直输入信息；
          $('#new_ipt')
            .off()
            .on('input', function() {
              me.all.enter_key = 'enter';
            });
        },
        // 接受信息 显示
        ev_common_all_newInfo_one: function() {

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



        // ==========================================
        // 公共选择一个进入私聊
        ev_common_one_newInfo_one: function() {

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

              // 聊天对象 已经没有marker 用户已经下线
              if (me.all.map_user[$(e.currentTarget).attr('_id')] == null) {
                layer.msg('该用户已经下线');
                return;
              }



              // 创建私信的数据包
              // _id:聊天对象的ID
              // net_name：聊天对象的网名
              // info：聊天的信息；
              one_data._id = $(e.currentTarget).attr('_id');
              one_data.net_name = $(e.currentTarget).find('.name').html();
              one_data.info = '';

              // 发起单个聊天
              me.ev_one();
            });
        },







        // ======================================================================
        // 单个聊天
        ev_one: function() {
          // 点击头像的第一次
          if (me.all.users[one_data._id] == undefined) {

            // 初始化聊天的对象体

            me.all.users[one_data._id] = {
              // 组合ID 目标ID_当前用户ID
              ID: "",
              // 目标ID
              _id: "",
              // 弹窗层级
              index: -1,
              // 数据包
              all: null,
              // 上卷高度
              top: 0,
            };

            // 
            me.all.users[one_data._id]._id = `${one_data._id}`;
            me.all.users[one_data._id].ID = `${one_data._id}_${window.sessionStorage.getItem("_id")}`;
            me.all.users[one_data._id].all = one_data;

            // 新信息弹窗，关闭弹窗会 清空 me.all.users[one_data._id] 
            me.ev_one_layer(me.all.users[one_data._id].ID, one_data._id);
          }
          // 当前用户点击 目标头像的第2次
          else {
            me.all.users[one_data._id].all = one_data;

            // 显示过来的信息
            me.ev_one_layer_newInfo_show(me.all.users[one_data._id].ID, one_data._id, me.all.users[one_data._id].all);
          }
        },
        // 新弹窗
        ev_one_layer: function(ID, _id) {

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

              // 把信息显示出来
              me.ev_one_layer_newInfo_show(ID, _id, me.all.users[_id].all);

              // 发送 信息
              me.ev_one_layer_newInfo_send(ID, _id);
            },
            cancel: function(index, layero) {
              // 取消时，当前对象体注销
              me.all.users[_id] = undefined;
            }
          });
        },
        // 发送-新消息
        ev_one_layer_newInfo_send: function(ID, _id) {
          $(`#${ID}_send`)
            .off()
            .on('click', function() {
              if ($(`#${ID}_ipt`).val() == '') {
                return;
              }

              // 本地 先显示 刚才自己输入的 信息
              me.ev_one_layer_newInfo_show(ID, _id, {
                // 当前用户的ID
                _id: window.sessionStorage.getItem("_id"),
                // 当前的网名
                net_name: me.all.user_obj.net_name,
                // 自己说的话；
                info: $(`#${ID}_ipt`).val()
              });


              // 远程：发送数据包
              me._io_emit_one_newInfo_one({
                // 当前用户
                from: window.sessionStorage.getItem("_id"),
                // 目标用户
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
        // 显示新消息
        ev_one_layer_newInfo_show: function(ID, _id, data) {
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










        // ============================================发出的 全是自己的管道
        // 初始化登记
        _io_emit_one_newUser_init: function(data) {
          // 向后台发出自己的信息；
          // 这个地方的 me.io 代表是用户已经连接到后台的连接的socket
          me.io.emit('one_newUser_init', data);
        },


        // 信息登记
        _io_emit_one_newUser_all: function(data) {
          // 向后台发出自己的信息；
          // 这个地方的 me.io 代表是用户已经连接到后台的连接的socket
          me.io.emit('one_newUser_all', data);
        },
        // 新的消息到全部用户
        _io_emit_one_newInfo_all: function(data) {
          me.io.emit('one_newInfo_all', data);
        },
        // 下线
        _io_emit_one_userOut_all: function(data) {
          me.io.emit('one_userOut_all', data);
        },
        // 发送给某个用户的数据
        _io_emit_one_newInfo_one: function(data) {
          me.io.emit('one_newInfo_one', data);
        },







        // ============================================接受的全是大管道
        _receive_IO: function() {
          // 只能是单向的接受
          // 通知所有用户
          me._receive_IO_all_newUser_one();

          // 接受大管道：全体新信息
          me._receive_IO_all_newInfo_one();

          // 接受单个信息
          me._receive_IO_new_info_one();
        },
        // 接受大管道：通知所有用户：新用户来到通知
        _receive_IO_all_newUser_one: function() {
          me.io.on("all_newUser_one", function(data) {


            // 通知的信息
            chat_data = data;

            // 推入公共区域新信息--自己的欢迎词；
            me.ev_common_all_newInfo_one();

            // 公屏打点
            me._marker_user_info(chat_data);
          });
        },
        // 接受大管道：通知所有用户：新用户输入的信息
        _receive_IO_all_newInfo_one: function() {
          // 
          me.io.on("all_newInfo_one", function(data) {

            chat_data = data;

            // 公屏显示---用户的信息
            me.ev_common_all_newInfo_one();


            // 地图点退出
            if (data.key == 'out') {
              me._marker_user_out(chat_data)
            }
            // 地图点个人信息 改变
            else if (data.key == 'upd') {
              me._marker_user_upd(chat_data);
            }
            // 地图点 新的聊天信息
            else {
              me._marker_user_info(chat_data);
            }


          });
        },
        // 接受大管道的信息：个人信息：
        _receive_IO_new_info_one: function() {
          me.io.on("allOne_newInfo_one", function(data) {
            // console.log(data);

            // 创建私信的数据包
            one_data._id = data.from;
            one_data.net_name = data.from_net_name;
            one_data.info = data.info;

            // 没有弹窗就弹窗，有弹窗就显示最新信息
            me.ev_one();
          });
        },







        // 返回到第一页
        _page_1: function() {
          window.location.href = '../demo_001_login/index.html';
        },


      };
      for (var key in fns) {
        me[key] = fns[key];
      }
    },

  };
  window.Model = Model;
})(jQuery);
