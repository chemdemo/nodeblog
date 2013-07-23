var settings = require('../../settings');
var rcodes = settings.RCODES;

var validator = require('validator');
//var check = validator.check;
var sanitize = validator.sanitize;

var user_ctrl = require('./user');

/*function signup(info, callback) {
	if(info.name && info.email) {
		user_ctrl.findOne(info, function(err, doc) {
			if(!err && doc) {
				callback(null, doc);
			} else {
				user_ctrl.addOne(info, function(_err, _doc) {
					if(!_err && _doc) {
						callback(null, _doc);
					} else {
						callback(_err);
					}
				});
			}
		});
	} else {
		callback({errinfo: 'Param name and email required.'});
	}
}*/

exports.login = function(req, res, next) {
	var info = {};
	info.name = sanitize(req.body.name).trim().toLowerCase();
	info.email = sanitize(req.body.email).trim();
	info.site = sanitize(req.body.site || '').trim();

	if(!info.name || !info.email) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Param name and email required.'
		});
	}

	var loginSuccess = function(doc) {
		req.session.user = doc;
		req.flash('success', 'Login success!');
		res.redirect('/');
	};

	user_ctrl.findOne(info, function(err, doc) {
		if(!err) {
			loginSuccess(doc);
		} else {
			user_ctrl.addOne(info, function(_err, _doc) {
				if(!_err) {
					loginSuccess(_doc);
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