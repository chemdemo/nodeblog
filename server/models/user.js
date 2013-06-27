var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	name: String,
	email: String,
	avatar: String,
	site: String,
	create_at: {type: Date, default: Date.now, index: true},
	modify_at: {type: Date, default: Date.now}
});

mongoose.model('User', User);