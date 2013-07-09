var settings = require('../../settings');
var rcodes = settings.RCODES;
var models = require('../models');
var Post = models.Post;

var user_ctrl = require('./user');

function findById(postid, callback) {
	Post.findById(postid, callback);
}

exports.addOne = function(req, res, next) {
	var user = req.session.user;
	var title = req.body.title;
	var content = req.body.body;
	var tags = JSON.parse(req.body.tags || null) || [];
	var top = req.body.top || false;

	if(!title || !content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'], 
			errinfo: 'Both title and content are required.'
		});
	}

	//user_ctrl.findById(user._id, function(err, doc) {
	//if(!err && doc) {
	var post = new Post();
	post.title = title;
	post.content = content;
	post.tags = tags;
	post.top = top;
	post.author = user.name;

	post.save(function(err, doc) {
		if(err) {
			req.flash('error', 'Post error!');
			return res.json({
				rcode: rcodes['FIND_POST_ERROR'], 
				errinfo: err
			});
		}
		req.flash('success', 'Post success!');
		//res.redirect('/post/' + doc._id);
		res.json({
			rcode: rcodes['SUCCESS'],
			result: {postid: doc._id}
		});
	});
	//} else {
		//;
	//}
	//});
}

exports.findOne = function(req, res, next) {
	//var user = req.session.user;
	var postid = req.query.postid;

	findById(postid, function(err, doc) {
		if(!err && doc) {
			res.render('edit', doc);
		} else {
			next(404);
		}
	});
}

exports.updateOne = function(req, res, next) {
	var postid = req.body.postid;
	var update = JSON.parse(req.body.update || null);

	Post.findOneAndUpdate({_id: postid}, update || {}, function(err, doc) {
		if(!err && doc) {
			res.json({
				rcode: rcodes['SUCCESS'],
				result: {postid: doc._id}
			});
		} else {
			res.json({
				rcode: rcodes['UPDATE_POST_ERROR'],
				errinfo: err
			});
		}
	});
}