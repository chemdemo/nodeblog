var settings = require('../../settings');

var user_ctrl = require('./user');

exports.signup = function(req, res, next) {
	if(req.session.user) return res.redirect('/login');

	if(req.method === 'POST') {
		var admin = settings.ADMIN;
		var info = {
			name: req.body.name,
			email: req.body.email,
			pass: settings.DEFAULT_PASS,
			site: req.body.site
		};
		var infoTmp = info;

		info = user_ctrl.infoCheck(info);
		if(info.error) return res.render('signup', {error: info.error});

		if(info.email === admin.EMAIL) {
			info.name = admin.NAME;
			info.pass = admin.PASS;
			info.site = admin.SITE;
		}

		user_ctrl.findOne({email: info.email}, function(err, doc) {
			if(err) return next(err);

			if(!doc) {// add a user
				user_ctrl.addOne(info, function(err, doc) {
					if(err) return next(err);
					//doc.isAdmin = user_ctrl.adminCheck(doc);
					req.session.user = doc;
					res.render('info', doc);
				});
			} else {
				infoTmp.error = 'This email has already been registered.';
				res.render('signup', infoTmp);
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
					//doc.isAdmin = user_ctrl.adminCheck(doc);
					req.session.user = doc;
					res.render('info', doc);
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

exports.loginCheck = function(req, res, next) {
	if(!req.session.user) {
		return res.redirect('/login');
	}
	next();
}

exports.adminCheck = function(req, res, next) {
	if(!user_ctrl.adminCheck(req.session.user)) {
		return next(403);
	}
	next();
}

exports.logout = function(req, res, next) {
	req.session.user = null;
	//req.flash('success', 'Logout success!');
	res.redirect('/');
	//next();
	//req.session.destroy();
	//res.clearCookie(config.auth_cookie_name, { path: '/' });
	//res.redirect(req.headers.referer || 'home');
}