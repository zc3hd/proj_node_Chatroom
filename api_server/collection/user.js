var mongoose = require('mongoose');

// 集合标识
var model_key = 'user_doc';

// 文档模型
var doc_model = new mongoose.Schema({
  // 用户名称
  name: { type: String, unique: true },
  // 密码
  ps: String,
  // 昵称
  net_name: String,
  // 性别
  sex: Number,

  // 坐标
  lng: Number,
  lat: Number,
});


// 模型
module.exports = mongoose.model(model_key, doc_model, model_key);
