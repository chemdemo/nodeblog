var settings = require('../../settings');
var rcodes = settings.RCODES;

//var user = require('./user');
var sign = require('./sign');
var post = require('./post');
var tag = require('./tag');
var comment = require('./comment');

exports.auth = function(req, res, next) {
	if(!req.session.user) {
		return res.redirect('/login');
	}
	next();
}

//exports.user = user;
exports.sign = sign;
exports.post = post;
exports.tag = tag;
exports.comment = comment;