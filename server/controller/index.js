var settings = require('../../settings');
var rcodes = settings.RCODES;

var user = require('./user');
var post = require('./post');
var tag = require('./tag');
var comment = require('./comment');

exports.login_check = function(req, res, next) {
	;
}

exports.post = post;
exports.tag = tag;
exports.comment = comment;