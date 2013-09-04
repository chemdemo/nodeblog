var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: String,
	email: String,
	pass: String,
	//avatar: String,
	site: String,
	admin: {type: Boolean, default: false},
	create_at: {type: Date, default: Date.now, index: true},
	modify_at: {type: Date, default: Date.now}
}, {collection: 'user'});

mongoose.model('User', UserSchema);