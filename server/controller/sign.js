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

// 百度的social login没法解决登陆成功后跳转回原页面的问题（无法拿到referer），暂不接入
/*exports.socialLogin = function(req, res, next) {
	var tokenUrl = 'https://openapi.baidu.com/social/oauth/2.0/token';
	var infoUrl = 'https://openapi.baidu.com/social/api/2.0/user/info?access_token=';
	var code = req.query.code || req.params.code;
	var request = require('request');
	var qs = require('querystring');
	var q;

	if(!code) return next(404);

	q = qs.stringify({
		grant_type: 'authorization_code',
		client_id: settings.SOCIAL_AUTH_INFO.API_KEY,
		client_secret: settings.SOCIAL_AUTH_INFO.SCRIPT_KEY,
		redirect_uri: 'http://www.dmfeel.com/social/oauth/callback',
		code: code
	});

	request.get(tokenUrl + '?' + q, function(err, _res, body) {
		if(!err) {
			body = JSON.parse(body);
			request.get(infoUrl + body.access_token, function(err, _res, body) {
				console.log(err, body);
				//res.redirect('/');
				console.log('referer: ', req.headers.referer)
				if(!err) {
					body = JSON.parse(body);
					res.json(body);
				} else next(err);
			});
		} else next(err);
	});
}*/

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
