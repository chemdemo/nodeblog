var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	name: String,
	email: String,
	avatar: String,
	site: String
});

mongoose.model('User', User);