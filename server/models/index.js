var settings = require(__dirname + '/settings');
var mongoose = require('mongoose');
var db_url = 'mongodb://' + settings.DB_HOST + ':' + settings.DB_PORT + '/' + settings.DB_NAME;

mongoose.connect(db_url, function() {
	if(!err) {
		console.log('Connect to db success!');
	} else {
		console.error('Connect to db error.\ndb_url: '+db_url+'.\nError message: ' + err.message);
	}
});

require('./user');
require('./post');
require('./tags');
require('./comment');

exports.User = mongoose.model('User');
exports.Post = mongoose.model('Post');
exports.Tag = mongoose.model('Tag');
exports.Comment = mongoose.model('Comment');