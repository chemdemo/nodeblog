var settings = require('../../settings');
var rcodes = settings.RCODES;

var login = require('./login');
var user = require('./user');
var post = require('./post');
var tag = require('./tag');
var comment = require('./comment');

exports.authCheck = function(req, res, next) {
	if(!req.session.user) {
		return res.redirect('/login');
	}
	next();
}

exports.login = login;
exports.user = user;
exports.post = post;
exports.tag = tag;
exports.comment = comment;