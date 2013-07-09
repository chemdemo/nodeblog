var settings = require('../../settings');
var rcodes = settings.RCODES;

var validator = require('validator');
//var check = validator.check;
var sanitize = validator.sanitize;

var user_ctrl = require('./user');

exports.login = function(req, res, next) {
	var name = sanitize(req.body.name).trim().toLowerCase();
	var email = sanitize(req.body.email).trim();
	var site = sanitize(.site || '').trim();

	var info = {
		name: name,
		email: email,
		site: site
	};

	user_ctrl.findOne(info, function(err, doc) {
		if(!err && doc) {
			req.session.user = doc;
			req.flash('success', 'Login success!');
			//res.redirect('/');
			next();
		} else {
			user_ctrl.addOne(info, function(_err, _doc) {
				if(!_err && _doc) {
					req.session.user = _doc;
					req.flash('success', 'Login success!');
					next();
				} else {
					req.session.user = null;
					req.flash('error', 'Login error!');
					res.redirect('/login');
				}
			});
		}
	});
}

exports.logout = function(req, res, next) {
	req.session.user = null;
	req.flash('success', 'Logout success!');
	//res.redirect('/');
	next();
	//req.session.destroy();
	//res.clearCookie(config.auth_cookie_name, { path: '/' });
	//res.redirect(req.headers.referer || 'home');
}