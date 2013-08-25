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
		res.render('login', {user: req.session.user});
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