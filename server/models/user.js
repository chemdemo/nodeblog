var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: String,
	email: String,
	avatar: String,
	site: String,
	create_at: {type: Date, default: Date.now, index: true},
	modify_at: {type: Date, default: Date.now}
}, {collection: 'user'});

mongoose.model('User', UserSchema);