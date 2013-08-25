/*
 * GET home routes page.
 */
var settings = require('../../settings');
var controller = require('../controller');
//var user = controller.user;
var sign = controller.sign;
var login = controller.login;
var post = controller.post;
var tag = controller.tag;
var comment = controller.comment;

function checkLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', '未登录!');
		//return res.redirect('/login');
	}
	next();
}

function checkNotLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', '已登录!');
		//return res.redirect('/');
	}
	next();
}

function adminCheck(req, res, next) {
	var user = req.session.user;
	var admin = settings.ADMIN;
	return user && user.name === admin.NAME && user.email === admin.EMAIL && user.pass === admin.PASS;
}

function home(req, res, next) {
	res.render('index');
}

function routes(app) {
	app.get('/', home);
	app.get('/index', home);
	app.get('/home', home);

	app.get('/signup', function(req, res, next) {
		res.render('signup', {user: req.session.user});
	});
	app.post('/signup', sign.signup);

	app.get('/login', function(req, res, next) {
		res.render('login', {user: req.session.user || {name: ''}});
	});
	app.post('/login', sign.login);

	app.get('/post', function(req, res, next) {
		res.render('post');
	});

	app.get('/edit', function(req, res, next) {
		res.render('edit');
	});
}

module.exports = routes;