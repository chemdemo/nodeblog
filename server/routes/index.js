/*
 * GET home routes page.
 */
/*var controller = require('../controller');
var user = controller.user;
var post = controller.post;
var tag = controller.tag;
var comment = controller.comment;*/

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

function home(req, res, next) {
	res.render('index');
}

function routes(app) {
	app.get('/', home);
	app.get('/index', home);
	app.get('/home', home);

	app.get('/post', function(req, res, next) {
		res.render('post');
	});

	app.get('/edit', function(req, res, next) {
		res.render('edit');
	});
}

module.exports = routes;