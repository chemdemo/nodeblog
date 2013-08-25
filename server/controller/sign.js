var settings = require('../../settings');

var user_ctrl = require('./user');

exports.signup = function(req, res, next) {
	var admin = settings.ADMIN;
	var info = {
		name: req.query.name,
		email: req.query.email,
		pass: settings.DEFAULT_PASS,
		site: req.query.site
	};

	info = user_ctrl.infoCheck(info);
	if(info.error) return res.render('/signup', {error: info.error});

	if(info.email === admin.EMAIL && info.name === admin.NAME && info.site === admin.SITE) {
		info.pass = admin.PASS;
	}

	user_ctrl.findOne({email: info.email, pass: info.pass}, function(err, doc) {
		if(err) return next(err);

		if(!doc) {// add a user
			user_ctrl.addOne(info, function(err, doc) {
				if(err) return next(err);
				req.session.user = doc;
				res.render('/signup', {user: doc, isNew: true});
			});
		} else {
			res.render('/signup', {error: 'This email has already been registered.'});
		}
	});
}

exports.login = function(req, res, next) {
	var info = {}
	//info.name = req.query.name;
	info.email = req.query.email;
	info.pass = req.query.pass;
	//info.site = req.query.site;

	//info = user_ctrl.infoCheck(info);
	//if(info.error) return res.render('/login', {error: info.error});
	if(!info.email || !info.pass) {
		return res.render('/login', {error: 'Param missing.'});
	}

	user_ctrl.findOne(info, function(err, doc) {
		if(err) return next(err);
		if(!doc) return res.redirect('/signup', {user: info});
		req.session.user = doc;
		res.redirect(req.headers.referer || '/');
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