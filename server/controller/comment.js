var settings = require('../../settings');
var admin = settings.ADMIN;

var models = require('../models');
var Comment = models.Comment;
var post_ctrl = require('./post');
var user_ctrl = require('./user');

var sanitize = require('validator').sanitize;
var tools = require('../utils/tools');
var EventProxy = require('eventproxy');
var async = require('async');
var _ = require('underscore');

function findById(commentid, callback) {
	Comment.findById(commentid).exec(callback);
}

/*function findOne(conditions, fields, callback) {
	Comment.find(conditions, fields, callback);
}*/

function findByIdAndUpdate(commentid, update, callback) {
	Comment.findByIdAndUpdate(commentid, update, callback);
}

function findCommentsByPostId(postid, callback) {
	// 缓存userinfo
	var infoCache = {};

	Comment.find({post_id: postid})
		.$where(function() {return !this.reply_id})
		.sort({create_at: 1})
		.exec(function(err, cs) {
			if(err) return callback(err);
			if(cs.length === 0) return callback(null, []);

			var ep = new EventProxy().after('all_find', cs.length, function(comments) {
				callback(null, comments);
			}).fail(function(err) {callback(err);});

			var findReplies = function(replyid, callback) {
				Comment.find({reply_id: replyid}, callback);
			};

			var findAuthor = function(uid, callback) {
				if(infoCache[uid]) return callback(null, infoCache[uid]);

				user_ctrl.findById(uid, 'name avatar site admin', function(err, doc) {
					if(err) return callback(err);
					if(!doc) {
						doc = {
							_id: '',
							name: '[已注销]',
							email: '',
							avatar: settings.DEFAULT_AVATAR
						}
					}
					callback(null, doc);
					infoCache[uid] = doc;
				});
			};

			var findReplyAndAuthor = function(comment, i) {
				comment.replies = [];
				var proxy = EventProxy.create('find_replies', 'find_author', function(replies, author) {
					console.log(replies)
					comment.replies = comment.replies.unshift(replies);
					comment.author = author;
					console.log(comment)
					ep.emit('all_find', {x:11111});
				}).fail(function(err) {ep.emit('error', err);});

				findReplies(comment._id, function(err, replies) {
					if(err) return proxy.emit('error', err);
					if(!replies) return proxy.emit('find_replies', []);

					var ep2 = new EventProxy().after('users_find', replies.length, function(list) {
						proxy.emit('find_replies', list);
					}).fail(function(err) {proxy.emit('error', err);});

					var findUsers = function(reply) {
						var proxy2 = EventProxy.create('origin', 'replyer', function(origin, replyer) {
							reply.replyUser = origin;
							reply.author = replyer;
							ep2.emit('users_find', reply);
						}).fail(function(err) {ep2.emit('error', err);});

						findAuthor(reply.reply_user_id, function(err, doc) {
							if(err) return proxy2.emit('error', err);
							proxy2.emit('origin', doc);
						});

						findAuthor(reply.author_id, function(err, doc) {
							if(err) return proxy2.emit('error', err);
							proxy2.emit('replyer', doc);
						});
					};

					_(replies).each(findUsers);
				});

				findAuthor(comment.author_id, function(err, doc) {
					if(err) return proxy.emit('error', err);
					proxy.emit('find_author', doc);
				});
			};

			//_(cs).each(findReplyAndAuthor);
			cs.forEach(findReplyAndAuthor);
		});

	// == > 
	/*[
		{
			id: 'x',
			author: {},
			replies: []
		},
		{
			id: 'xx',
			author: {},
			replies: [
				{id: 'yy', replies: [], replyUser: {}, author: {}}
			]
		}
	]*/
}

exports._add = function(req, res, next) {
	var user = req.session.user || null;
	var postid = req.body.postid;
	var content = req.body.content;
	var commentid = req.body.commentid;
	var name = req.body.name || '';
	var email = req.body.email || '';
	var site = req.body.site || '';

	content = sanitize(content).trim();

	if(!postid || !content) {
		console.log('Both param postid and content are required.');
		return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Both param postid and content are required.');
	}

	// 这里其实不是并发执行，任务是串行的
	var proxy = EventProxy.create(
		'post_found'
		, 'user_checked'
		, 'comment_added'
		, 'comment_saved'
		, 'post_saved'
		, function() {
			tools.jsonReturn(res, 'SUCCESS', 0);
		}).fail(function(err) {
			if(err === 'adminAuthError') return emitErr('Admin need login.', err);
			console.log('Add comment error, err: ', err);
			tools.jsonReturn(res, 'DB_ERROR', null, 'Add comment error.');
		});

	var emitErr = function(msg, err) {
		console.log(msg, err);
		proxy.emit('error', msg);
	};

	proxy.on('comment_saved', function(post) {
		post.comments ++;
		post.save(function(err, doc) {
			proxy.emit('post_saved');
			if(err) emitErr('Add comments number error.', err);
		});
	});

	proxy.on('comment_added', function(post, comment) {
		if(commentid) {
			findById(commentid, function(err, doc) {
				//if(err || !doc) return emitErr('Comment not found by commentid.', err);
				// 找不到要回复的评论就算是添加新评论
				if(err || !doc) {
					console.log('Comment not found by commentid.', err);
					return proxy.emit('comment_saved', post);
				}

				Comment.findByIdAndUpdate(comment._id, {
					$set: {reply_id: doc._id}
				}, {
					upsert: true
				}, function(err, doc) {
					if(err) return emitErr('Add reply_id error.', err);
					proxy.emit('comment_saved', post);
				});
			});
		} else {
			proxy.emit('comment_saved', post);
		}

		/*post_ctrl.findByIdAndUpdate(postid, {
			last_comment_at: Date.now(),
			last_comment_by: new_comment.author_id,
			$inc: {comments: 1}
		}, function(err, doc) {
			if(err) return proxy.emit('error', err);
			proxy.emit('post_saved');
		});*/
	});

	proxy.on('user_checked', function(post, user) {
		var comment = new Comment();
		comment.post_id = postid;
		comment.author_id = user._id;
		comment.content = content;
		comment.save(function(err, doc) {
			if(err) return proxy.emit('error', err);
			proxy.emit('comment_added', post, doc);
		});
	});

	proxy.on('post_found', function(post) {
		if(user) {
			proxy.emit('user_checked', post, user);
		} else {
			var info = {
				name: name,
				email: email,
				pass: settings.DEFAULT_USER_PASS,
				site: site
			};
			info = user_ctrl.infoCheck(info);

			if(info.error) return emitErr(info.error, info.error);
			if(email === admin.EMAIL) return proxy.emit('error', 'adminAuthError');

			user_ctrl.findOne({
				email: info.email
				, name: info.name
				//, pass: info.pass
			}, function(err, doc) {
				if(err) return emitErr('Find user error.', err);

				if(doc) {
					//doc.isAdmin = user_ctrl.adminCheck(doc);
					req.session.user = user = doc;
					proxy.emit('user_checked', post, user);
					// update user info
					if(info.site && info.site !== doc.site) {
						user_ctrl.findByIdAndUpdate(doc._id, {
							$set: {
								site: info.site
								//, name: info.name
							}
						}, function(err) {
							if(err) console.log('Update user info error: ', err);
						});
					}
				} else {
					user_ctrl.addOne(info, function(_err, _doc) {
						if(_err) return emitErr('Add user error.', _err);
						//_doc.isAdmin = user_ctrl.adminCheck(_doc);
						req.session.user = user = _doc;
						proxy.emit('user_checked', post, user);
					});
				}
			});
		}
	});

	post_ctrl.findById(postid, null, function(err, doc) {
		if(err || !doc) return emitErr('Post find error.', err);
		proxy.emit('post_found', doc);
	});
}

function checkUser(user, callback) {
	user = user_ctrl.infoCheck(user);
	if(user.error) return callback(user.error);

	user_ctrl.findOne({name: user.name, email: user.email}, function(err, doc) {
		if(err) return callback(err);

		if(!doc) {
			user_ctrl.addOne(user, callback);
		} else {
			callback(null, doc);
		}
	});
}

exports.add = function(req, res, next) {
	var postid = req.body.postid || req.params.postid;
	var user = JSON.parse(req.body.user || null);
	var sUser = req.session.user;
	var content = sanitize(req.body.content || '').trim();
	var replyId = req.body.reply_id;// this is a reply
	var at = req.body.set_at; // this is a reply and @ anothor user

	if(!user) return tools.jsonReturn(res, 'PARAM_MISSING', null, 'User info missing.');
	if(!content) return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Comment content null.');
	
	if(user.email !== admin.EMAIL) {
		user.pass = settings.DEFAULT_USER_PASS;
	} else {// for admin
		if(sUser && sUser.admin) {
			user.pass = admin.PASS;
		} else {
			return tools.jsonReturn(res, 'AUTH_ERROR', null, 'Admin need login first.');
		}
	}

	// 这里其实不是并发执行，任务是串行的
	var proxy = EventProxy.create(
		'user_check'
		, 'reply_check'
		//, 'at_user_check'
		, 'add_comment'
		, function() {
			tools.jsonReturn(res, 'SUCCESS', 0);
		}).fail(function(err) {
			console.log('Add comment error.', err);
			tools.jsonReturn(res, 'DB_ERROR', null, 'Add comment error.');
		});

	var emitErr = function(msg, err) {
		console.log(msg, err);
		proxy.emit('error', msg);
	};

	proxy.on('reply_check', function(user, reply_comment) {
		var comment = new Comment();
		comment.post_id = postid;
		comment.author_id = user._id;
		comment.content = content;

		if(reply_comment) {
			comment.reply_id = reply_comment._id;
			if(at) {
				comment.reply_user_id = reply_comment.author_id;
			}
		}
		
		comment.save(function(err, doc) {
			if(err) return proxy.emit('error', err);
			proxy.emit('add_comment');
			post_ctrl.findByIdAndUpdate(postid, {
				$set: {
					last_comment_at: Date.now(),
					last_comment_by: doc.author_id
				},
				$inc: {comments: 1}
			}, function(err) {
				if(err) console.log('Update post error.', err);
			});
		});
	});

	proxy.on('user_check', function(user) {
		if(replyId) {
			//return proxy.emit('at_user_check', user, replyCID);
			Comment.findById(replyId, function(err, doc) {
				if(err) return emitErr('error', 'Find reply comment error.', err);
				proxy.emit('reply_check', user, doc);
			});
		} else {
			proxy.emit('reply_check', user, null);
		}
	});

	checkUser(user, function(err, doc) {
		if(err) return emitErr('Check user error on add comment.', err);
		proxy.emit('user_check', doc);
	});
}

exports.findAllByPostId = function(req, res, next) {
	var postid = req.body.postid || req.params.postid;
	var user = req.session.user;

	if(!postid) {
		return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Param postid required.');
	}

	findCommentsByPostId(postid, function(err, comments) {
		if(err) return tools.jsonReturn(res, 'DB_ERROR', null, 'Find comments error.');
		tools.jsonReturn(res, 'SUCCESS', {user: user, comments: comments});
	});
}

exports.remove = function(req, res, next) {
	;
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;