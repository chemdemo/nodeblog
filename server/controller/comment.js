var settings = require('../../settings');
var rcodes = settings.RCODES;

var models = require('../models');
var Comment = models.Comment;
var post_ctrl = require('./post');
var user_ctrl = require('./user');

var sanitize = require('validator').sanitize;
var EventProxy = require('eventproxy');

function findById(commentid, callback) {
	Comment.findById(commentid).exec(callback);
}

/*function findOne(conditions, fields, callback) {
	Comment.find(conditions, fields, callback);
}*/

function findByIdAndUpdate(commentid, update, callback) {
	Comment.findByIdAndUpdate(commentid, update, callback);
}

/*function addAComment(detail, callback) {
	var comment = new Comment();
	comment.post_id = detail.postid;
	comment.author_id = detail.user._id;
	comment.content = detail.content;
	comment.save(callback);
}*/

exports.addOne = function(req, res, next) {
	var user = req.session.user || null;
	var postid = req.body.postid;
	var content = req.body.content;
	var commentid = req.body.commentid;
	var name = req.body.name;
	var email = req.body.email;
	var site = req.body.site;

	if(!postid || !content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Both param postid and content are required.'
		});
	}

	content = sanitize(content).trim();

	if('' === content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Comment content can not be empty.'
		});
	}

	var proxy = EventProxy.create('user_exist', 'comment_added', 'comment_saved', 'post_saved', function() {
		res.json({
			rcode: rcodes['SUCCESS'],
			result: 0
		});
	});
	proxy.fail(next);

	proxy.on('comment_added', function(new_comment) {
		if(commentid) {
			findById(commentid, function(err, doc) {
				if(!err) {
					var replies = doc.replies || (doc.replies = []);
					doc.replies.push(new_comment._id);
					dov.save(function(_err, _doc) {
						if(!_err) {
							proxy.emit('comment_saved');
						}
					});
				}
			});
		} else {
			proxy.emit('comment_saved');
		}

		post_ctrl.findByIdAndUpdate(postid, {
			last_comment_at: Date.now(),
			last_comment_by: new_comment.author_id,
			$inc: {comments: 1}
		}, function(err, doc) {
			if(!err) {
				proxy.emit('post_saved');
			}
		});
	});

	proxy.on('user_exist', function(user) {
		var comment = new Comment();
		comment.post_id = postid;
		comment.author_id = user._id;
		comment.content = content;
		comment.save(function(err, doc) {
			if(!err) {
				proxy.emit('comment_added', doc);
			}
		});
	});

	if(user) {
		proxy.emit('user_exist', user);
	} else {
		name = sanitize(name).trim();
		email = sanitize(email).trim();
		site = sanitize(site).trim();

		if(name && email) {
			user_ctrl.findOne({
				name: name,
				email: email,
				site: site
			}, function(err, doc) {
				if(err) {
					user_ctrl.addOne(info, function(_err, _doc) {
						if(!_err) {
							req.session.user = user = _doc;
							proxy.emit('user_exist', user);
						} else {
							console.log(_err);
							next(502);
						}
					});
				} else {
					req.session.user = user = doc;
					proxy.emit('user_exist', user);
				}
			});
		} else {
			next(403);
		}
	}
}

exports.findAllByPostId = function(req, res, next) {
	var postid = req.body.postid;

	if(!postid) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Param postid required.'
		});
	}

	Comment.find({post_id: postid}, function(err, doc) {
		if(!err) {
			var comments = doc || [];
		} else {
			res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		}
	});
}

exports.removeOne = function(req, res, next) {
	;
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;