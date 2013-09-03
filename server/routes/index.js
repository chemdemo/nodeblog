/*
 * GET home routes page.
 */
var settings = require('../../settings');
var controller = require('../controller');
//var user = controller.user;
var sign = controller.sign;
var post = controller.post;
var tag = controller.tag;
var comment = controller.comment;

var EventProxy = require('eventproxy');

function home(req, res, next) {
	//console.log('session: ', req.session.user);
	var proxy = EventProxy.create('posts', 'tags', 'counts', function(posts, tags, counts) {
		res.render('index', {
			posts: posts,
			tags: tags,
			counts: counts,
			home: true
		});
	}).fail(next);

	post.fetchByPage(0, 10, function(err, doc) {
		//console.log('fetchByPage: ', err, doc)
		if(err) return proxy.emit('error', err);
		proxy.emit('posts', doc);
	});

	tag.findAllTags(function(err, doc) {
		//console.log('findAllTags: ', err, doc)
		if(err) return proxy.emit('error', err);
		proxy.emit('tags', doc);
	});

	post.findCounts(function(err, doc) {
		//console.log('countMonthy: ', err, doc)
		if(err) return proxy.emit('error', err);
		proxy.emit('counts', doc);
	});
}

function routes(app) {
	// index
	app.get('/', home);
	app.get('/index', home);
	app.get('/home', home);
	
	// user about
	app.get('/signup', sign.signup);
	app.post('/signup', sign.signup);
	app.get('/login', sign.login);
	app.post('/login', sign.login);
	app.get('/info', sign.info);
	
	// post about
	app.get('/edit/:postid?', sign.loginCheck, sign.adminCheck, post.edit);
	app.post('/edit/:postid?', sign.loginCheck, sign.adminCheck, post.save);
	app.delete('/post/:postid', sign.loginCheck, sign.adminCheck, post.remove);
	app.get('/post/:postid', post.show);

	// comment about
	app.get('/comment/:postid?', comment.findAllByPostId);
	app.post('/comment/:postid?', comment.add);
	app.delete('/comment/:commentid?', sign.loginCheck, comment.remove);

	// tag about

	// post counts about
}

module.exports = routes;