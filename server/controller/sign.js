var settings = require('../../settings');
var tools = require('../utils/tools');

var user_ctrl = require('./user');

exports.signup = function(req, res, next) {
	if(req.session.user) return res.redirect('/login');

	if(req.method === 'POST') {
		var admin = settings.ADMIN;
		var info = {
			name: req.body.name,
			email: req.body.email,
			pass: req.body.pass || settings.DEFAULT_USER_PASS,
			site: req.body.site,
			avatar: req.body.avatar
		};

		info = user_ctrl.infoCheck(info);
		if(info.error) return res.render('signup', info);

		// danger!!
		// if(info.email === admin.EMAIL) {
		// 	info.pass = admin.PASS;
		// 	//info.name = admin.NAME;
		// 	//info.site = admin.SITE;
		// }

		user_ctrl.findOne({name: info.name, email: info.email}, function(err, doc) {
			if(err) return next(err);

			if(!doc) {// add a user
				user_ctrl.addOne(info, function(err, doc) {
					if(err) return next(err);
					//doc.isAdmin = user_ctrl.adminCheck(doc);
					delete doc.pass;
					user_ctrl.setCookie(res, doc);
					req.session.user = doc;
					res.render('info', doc);
				});
			} else {
				info.error = 'This name or email has already been registered.';
				res.render('signup', info);
			}
		});
	} else {
		res.render('signup', {});
	}
}

exports.login = function(req, res, next) {
	//console.log('user: ', req.session.user);
	if(req.method === 'POST') {
		var info = {};
		//info.name = req.body.name;
		info.email = req.body.email;
		info.pass = req.body.pass;
		//info.site = req.body.site;

		//info = user_ctrl.infoCheck(info);
		//if(info.error) return res.render('login', {error: info.error});
		if(!info.email || !info.pass) {
			return res.render('login', {
				email: info.email || '', 
				error: 'Param email and pass requird.'
			});
		}

		user_ctrl.findOne({email: info.email}, function(err, doc) {
			if(err) return next(err);
			if(!doc) {
				res.render('login', {email: info.email, error: 'This email is not registered.'});
			} else {
				if(user_ctrl.md5(info.pass) === doc.pass) {
					user_ctrl.setCookie(res, doc);
					req.session.user = doc;
					res.render('info', doc);
					//tools.jsonReturn(res, 'SUCCESS', 0);
				} else {
					res.render('login', {
						email: info.email, 
						error: 'Wrong user name or password.'
					});
				}
			}
		});
	} else {
		res.render('login', req.session.user);
	}
}

exports.logout = function(req, res, next) {
	req.session.destroy();
	res.clearCookie('_id');
	res.clearCookie('name');
	res.clearCookie('email');
	res.clearCookie('site');
	res.clearCookie('avatar');
	//req.session.user = null;
	if(req.xhr) {
		tools.jsonReturn(res, 'SUCCESS', 0);
	} else {
		res.redirect('/login');
	}
}

exports.info = function(req, res, next) {
	var user = req.session.user || null;
	if(user) user.avatar = user_ctrl.genAvatar(user.email);
	res.render('info', user);
}

exports.socialLogin = function(req, res, next) {
	var baidu_url = 'https://openapi.baidu.com/social/api/2.0/user/info?access_token=';
	var code = req.query.code || req.params.code;
	var https = require('https');
	console.log('code: ', code)

	if(!code) return next(404);

	https.get(baidu_url + code, function(_res) {
		_res.on('data', function(d) {
			process.stdout.write(d);
		});
		_res.on('end', function() {
			console.log('body: ', _res.body);
		});
	}).on('error', function(err) {
		console.log('https error: ', err);
	});
}

exports.loginCheck = function(req, res, next) {
	if(!req.session.user) {
		if(req.xhr) {
			return tools.jsonReturn(res, 'AUTH_ERROR', null, 'Need login!');
		}
		res.redirect('/login');
	}
	next();
}

exports.adminCheck = function(req, res, next) {
	if(!req.session.user.admin) {
		//return next(403);
		return res.send(403, 'Admin should login first.');
	}
	/*if(!user_ctrl.adminCheck(req.session.user)) {
		return next(403);
	}*/
	next();
}
