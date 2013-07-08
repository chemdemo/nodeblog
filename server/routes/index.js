/*
 * GET home routes page.
 */
var controller = require('../controller');
var user = controller.user;
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

function route(app) {
	;
}

module.exports = route;