# Socket.IO 聊天室

### 模拟实现：

* 长轮询：客户端每隔很短的时间，都会对服务器发出请求，查看是否有新的消息，只要轮询速度足够快，例如1秒，就能给人造成交互是实时进行的印象。这种做法是无奈之举，实际上对服务器、客户端双方都造成了大量的性能浪费。

* 长连接：客户端只请求一次，但是服务器会将连接保持，不会返回结果（想象一下我们没有写res.end()时，浏览器一直转小菊花）。服务器有了新数据，就将数据发回来，又有了新数据，就将数据发回来，而一直保持挂起状态。这种做法的也造成了大量的性能浪费。

### 实现原理：

* WebSocket的原理非常的简单：利用HTTP请求产生握手，HTTP头部中含有WebSocket协议的请求，所以握手之后，二者转用TCP协议进行交流（QQ的协议）。现在浏览器和服务器之间，就是QQ和QQ服务器的关系了。所以WebSocket协议，需要浏览器支持，更需要服务器支持。
* 支持WebSocket协议的浏览器有：Chrome 4、火狐4、IE10、Safari5
* 支持WebSocket协议的服务器有：*Node 0*、Apach7.0.2、Nginx1.3

### Node.js上需要写一些程序，来处理TCP请求。
* Node.js从诞生之日起，就支持WebSocket协议。不过，从底层一步一步搭建一个Socket服务器很费劲（想象一下Node写一个静态文件服务都那么费劲）。所以，有大神帮我们写了一个库Socket.IO。
* Socket.IO是业界良心，新手福音。它屏蔽了所有底层细节，让顶层调用非常简单。并且还为不支持WebSocket协议的浏览器，提供了长轮询的透明模拟机制。
* Node的单线程、非阻塞I/O、事件驱动机制，使它非常适合Socket服务器。

### 建立：

* npm install socket.io
* 写原生的JS，搭建一个服务器，server创建好之后，创建一个io对象

```js
   var http = require("http");
   
   var server = http.createServer(function(req,res){
       if(req.url == "/"){
     //显示首页
       fs.readFile("./index.html",function(err,data){
         res.end(data);
       });
      }

       res.end("你好");
   });
  
   var io = require('socket.io')(server);
    //监听连接事件
    //io对象连接时得到一个SOCket对象
    io.on("connection",function(socket){
        console.log("1个客户端连接了");
    })

   server.listen(3000,"127.0.0.1");

```

* 写完这句话之后，你就会发现，http://127.0.0.1:3000/socket.io/socket.io.js  就是一个js文件的地址了。

* 现在需要制作一个index页面，这个页面中，必须引用秘密js文件。调用io函数，取得socket对象。

```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>Document</title>
  </head>
  <body>
      <h1>我是index页面，我引用了秘密script文件</h1>
      <script type="text/javascript" src="/socket.io/socket.io.js"></script>
      <script type="text/javascript">
          //io对象得到一个SOCket
          var socket = io();
          socket.emit("tiwen","吃了么？");
      </script>
  </body>
  </html>
```


### 基本传输数据：

* socket.emit()用于发出一个自定义事件。
* socket.on()用于接收服务器发送的自定义事件。

```
      <script type="text/javascript">
          //io对象得到一个SOCket
          var socket = io();
          //定义一个关键字的事件进行传输数据
          socket.emit("tiwen","吃了么？");
          //接收服务器定义的关键字事件传输过来的数据
          socket.on("huida",function(msg){
            console.log("服务器说：" + msg);
          });
      </script>
```


```
//建立一个socket通州，可以--定义关键字--事件进行--传输数据， 接收数据。
io.on("connection",function(socket){
  console.log("1个客户端连接了");
  socket.on("tiwen",function(msg){
    console.log("本服务器得到了一个提问" + msg);
    //再次定义个关键字进行数据传输。
    socket.emit("huida","吃了");
  });
})
//接收这个提问  msg就是穿过来的数据---吃了么

```

* 这么来说的话，关键字的事件是可以无限定义，定义后就可以传输数据了。
* 然后传输的数据可以为任何数据。
* 每一个连接上来的用户都有一个socket，emit语句，是socket.emit()发出的，所以指的是向这个当前的客户端发出语句。

### 广播数据：
 
```
io.on("connection",function(socket){
  console.log("1个客户端连接了");
  socket.on("tiwen",function(msg){
    console.log("本服务器得到了一个提问" + msg);
    //向当前连接的所有用户发送信息---广播
    io.emit("huida","吃了");
  });
})
```

### 聊天室：

```
var express = require('express');
var app = express();
//socket.io公式：
var http = require('http').Server(app);
var io = require('socket.io')(http);
//监听
http.listen(3000);
```
