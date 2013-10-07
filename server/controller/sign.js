var settings = require('../../settings');
var tools = require('../utils/tools');

var user_ctrl = require('./user');

// 关闭注册接口
exports.signup = function(req, res, next) {
	//if(user_ctrl.getSessionUser(req)) return res.redirect('/');
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

		// dangerous
		if(info.email === admin.EMAIL) {
			info.pass = admin.PASS;
		}

		info.pass = user_ctrl.md5(info.pass);

		user_ctrl.findOne({name: info.name, email: info.email, pass: info.pass}, function(err, doc) {
			if(err) return next(err);

			if(!doc) {// add a user
				user_ctrl.addOne(info, function(err, doc) {
					if(err) return next(err);
					//delete doc.pass;
					user_ctrl.genSessionUser(res, doc);
					res.render('info', doc);
				});
			} else {
				info.error = 'This name or email has already been registered.';
				res.render('signup', info);
			}
		});
	} else {
		res.render('signup', user_ctrl.getSessionUser(req) || {});
	}
}

exports.login = function(req, res, next) {
	//console.log('user: ', req.session.user);
	if(req.method === 'POST') {
		var info = {};
		info.name = req.body.name;
		info.email = req.body.email;
		info.pass = req.body.pass;

		//info = user_ctrl.infoCheck(info);
		//if(info.error) return res.render('login', {error: info.error});
		if(!info.email || !info.pass) {
			info.error = '参数缺失！';
			return res.render('login', info);
		}

		user_ctrl.findOne({
			name: info.name
			, email: info.email
			, pass: user_ctrl.md5(info.pass)
		}, function(err, doc) {
			if(err) return next(err);
			if(!doc) {
				info.error = '此用户不存在！';
				res.render('login', info);
			} else {
				if(user_ctrl.md5(info.pass) === doc.pass) {
					user_ctrl.genSessionUser(res, doc);
					res.render('info', doc);
					//tools.jsonReturn(res, 'SUCCESS', 0);
				} else {
					info.error = '登陆信息错误！';
					res.render('login', info);
				}
			}
		});
	} else {
		res.render('login', user_ctrl.getSessionUser(req));
	}
}

exports.logout = function(req, res, next) {
	//req.session.destroy();
	req.session.user = null;
	res.clearCookie(settings.COOKIE_KEY, { path: '/' });
	if(req.xhr) {
		tools.jsonReturn(res, 'SUCCESS', 0);
	} else {
		res.redirect('/');
	}
}

exports.info = function(req, res, next) {
	res.render('info', user_ctrl.getSessionUser(req));
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

exports.loginCheck = function(req, res, next) {//console.log(req.session)
	if(!user_ctrl.getSessionUser(req)) {
		if(req.xhr) {
			return tools.jsonReturn(res, 'AUTH_ERROR', null, 'Need login!');
		}
		return res.redirect('/login');
	}
	next();
}

exports.adminCheck = function(req, res, next) {
	var user = user_ctrl.getSessionUser(req);

	if(user.admin) {
		next();
	} else {
		if(req.xhr) {
			tools.jsonReturn(res, 'AUTH_ERROR', null, 'Admin should login first.');
		} else {
			res.send(403, 'Admin should login first.');
			//res.redirect('/login');
		}
	}
}
