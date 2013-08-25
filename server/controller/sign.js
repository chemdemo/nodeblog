var settings = require('../../settings');

var user_ctrl = require('./user');

exports.signup = function(req, res, next) {
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
		info.site = admid.SITE;
	}

	user_ctrl.findOne({email: info.email, pass: info.pass}, function(err, doc) {
		console.log('findOne ', err, doc);
		if(err) return next(err);

		if(!doc) {// add a user
			user_ctrl.addOne(info, function(err, doc) {
				if(err) return next(err);
				doc.isAdmin = user_ctrl.adminCheck(doc);
				req.session.user = doc;
				res.redirect(req.headers.referer || '/');
			});
		} else {
			res.render('signup', {
				error: 'This email has already been registered.',
				user: infoTmp
			});
		}
	});
}

exports.login = function(req, res, next) {
	var info = {};
	//info.name = req.body.name;
	info.email = req.body.email;
	info.pass = req.body.pass;
	//info.site = req.body.site;

	//info = user_ctrl.infoCheck(info);
	//if(info.error) return res.render('login', {error: info.error});
	if(!info.email || !info.pass) {
		return res.render('login', {error: 'Param email and pass requird.'});
	}

	user_ctrl.findOne({email: info.email, pass: info.pass}, function(err, doc) {
		if(err) return next(err);
		if(!doc) return res.redirect('/signup');
		doc.isAdmin = user_ctrl.adminCheck(doc);
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