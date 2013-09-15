var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: String
	, email: {type: String/*, unique: true*/}
	, pass: String
	, avatar: String// 允许自定义头像
	, site: String
	, admin: {type: Boolean, default: false}
	, create_at: {type: Date, default: Date.now}
	, modify_at: {type: Date, default: Date.now}
}, {collection: 'user'});

mongoose.model('User', UserSchema);