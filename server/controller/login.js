var settings = require('../../settings');
var rcodes = settings.RCODES;

var user_ctrl = require('./user');

exports.login = function(req, res, next) {
	var name = sanitize(req.body.name).trim().toLowerCase();
	var pass = sanitize(req.body.pass).trim();
}

exports.logout = function(req, res, next) {
	req.session.destroy();
	//res.clearCookie(config.auth_cookie_name, { path: '/' });
	//res.redirect(req.headers.referer || 'home');
}