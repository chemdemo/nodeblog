var settings = require('../../settings');
var admin = settings.ADMIN;

var models = require('../models');
var Comment = models.Comment;
var post_ctrl = require('./post');
var user_ctrl = require('./user');

var tools = require('../utils/tools');
var sanitize = require('validator').sanitize;
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
		.exec(function(err, comments) {
			if(err) return callback(err);
			if(comments.length === 0) return callback(null, []);

			var ep = new EventProxy().after('all_find', comments.length, function(comments) {
				callback(null, comments);
			}).fail(function(err) {callback(err);});

			var findReplies = function(replyid, callback) {
				Comment.find({post_id: postid, reply_id: replyid}, callback);
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
					infoCache[uid] = doc.toObject({hide: '_id', transform: true});
				});
			};

			var findReplyAndAuthor = function(comment, i) {
				var proxy = EventProxy.create('find_replies', 'find_author', function(replies, author) {
					comment = comment.toObject({hide: 'post_id author_id', transform: true});
					comment.replies = replies;
					comment.author = author;
					comment.create_at = tools.dateFormat(comment.create_at, 'YYYY 年 MM 月 DD 日');
					tools.marked(comment.content, function(err, content) {
						if(!err) comment.content = content;
						ep.emit('all_find', comment);
					});
				}).fail(function(err) {ep.emit('error', err);});

				findReplies(comment._id, function(err, replies) {
					if(err) return proxy.emit('error', err);
					if(!replies) return proxy.emit('find_replies', []);

					var ep2 = new EventProxy().after('users_find', replies.length, function(list) {
						proxy.emit('find_replies', list);
					}).fail(function(err) {proxy.emit('error', err);});

					var findUsers = function(reply) {
						var proxy2 = EventProxy.create('origin', 'author', function(at, author) {
							reply = reply.toObject({hide: 'post_id author_id reply_user_id', transform: true});
							reply.create_at = tools.dateFormat(reply.create_at, 'YYYY 年 MM 月 DD 日');
							reply.at_author = at;
							reply.author = author;
							tools.marked(reply.content, function(err, content) {
								if(!err) reply.content = content;
								ep2.emit('users_find', reply);
							});
						}).fail(function(err) {ep2.emit('error', err);});

						findAuthor(reply.reply_user_id, function(err, doc) {
							if(err) return proxy2.emit('error', err);
							proxy2.emit('at', doc);
						});

						findAuthor(reply.author_id, function(err, doc) {
							if(err) return proxy2.emit('error', err);
							proxy2.emit('author', doc);
						});
					};

					_(replies).each(findUsers);
				});

				findAuthor(comment.author_id, function(err, doc) {
					if(err) return proxy.emit('error', err);
					proxy.emit('find_author', doc);
				});
			};

			_(comments).each(findReplyAndAuthor);
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
	var user = req.body.user || null;
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
		, function(user, reply, comment) {
			tools.jsonReturn(res, 'SUCCESS', comment);
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
			doc = doc.toObject({hide: 'post_id', transform: true});
			doc.create_at = tools.dateFormat(create_at, 'YYYY 年 MM 月 DD 日');
			tools.marked(doc.content, function(err, content) {
				if(!err) doc.content = content;
				proxy.emit('add_comment', doc);
			});
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
		doc = doc.toJSON({hide: 'pass', transform: true});
		console.log('user: ', doc)
		req.session.user = doc;
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