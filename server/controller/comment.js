var settings = require('../../settings');
var admin = settings.ADMIN;

var models = require('../models');
var Comment = models.Comment;
var post_ctrl = require('./post');
var user_ctrl = require('./user');

var tools = require('../utils/tools');
var filters = require('../utils/filters');
var sanitize = require('validator').sanitize;
var EventProxy = require('eventproxy');
var async = require('async');
var _ = require('underscore');

function findById(commentid, callback) {
    Comment.findById(commentid).exec(callback);
}

function findOne(conditions, fields, callback) {
    Comment.find(conditions, fields, callback);
}

function findByIdAndUpdate(commentid, update, callback) {
    Comment.findByIdAndUpdate(commentid, update, callback);
}

function findCommentsByPostId(postid, callback) {
    // 缓存userinfo
    var infoCache = {};

    //Comment.find(null, 'content').sort({create_at: 1}).exec(function(err, doc) {console.log(doc)});

    Comment.find({post_id: postid})
        .$where(function() {return !this.reply_id})
        .sort({create_at: 1})
        .exec(function(err, comments) {
            if(err) return callback(err);
            if(comments.length === 0) return callback(null, []);

            var ep = new EventProxy().after('all_find', comments.length, function() {
                callback(null, comments);
            }).fail(function(err) {callback(err);});

            var findReplies = function(replyid, callback) {
                //Comment.find({post_id: postid, reply_id: replyid}, callback);
                Comment.find({post_id: postid, reply_id: replyid})
                    .sort({create_at: 1})
                    .exec(callback);
            };

            var findAuthor = function(uid, callback) {
                if(infoCache[uid]) return callback(null, infoCache[uid]);

                user_ctrl.findById(uid, 'name email site', function(err, doc) {
                    if(err) return callback(err);
                    if(!doc) {
                        doc = {
                            _id: '',
                            name: '[已注销]',
                            email: '',
                            avatar: settings.DEFAULT_AVATAR
                        }
                    } else {
                        doc = doc.toObject();
                        doc.avatar = doc.avatar || user_ctrl.genAvatar(doc.email);
                        if(doc.site) doc.site = filters.genLink(doc.site);
                        //delete doc.email;
                    }
                    callback(null, doc);
                    infoCache[uid] = doc;
                });
            };

            var findReplyAndAuthor = function(comment, i) {
                var proxy = EventProxy.create('find_replies', 'find_author', function(replies, author) {
                    comment = comment.toObject({hide: 'post_id author_id', transform: true});
                    comment.replies = replies;
                    comment.author = author;
                    comment.create_at = tools.dateFormat(comment.create_at, 'YYYY 年 MM 月 DD 日 hh:mm:ss');
                    comments[i] = comment;
                    tools.marked(comment.content, function(err, content) {
                        if(!err) comment.content = content;
                        ep.emit('all_find'/*, comment*/);
                    });
                }).fail(function(err) {ep.emit('error', err);})

                findReplies(comment._id, function(err, replies) {
                    if(err) return proxy.emit('error', err);
                    if(!replies.length) return proxy.emit('find_replies', []);

                    var ep2 = new EventProxy().after('users_find', replies.length, function() {
                        proxy.emit('find_replies', replies);
                    }).fail(function(err) {proxy.emit('error', err);});

                    var findUsers = function(reply, j) {
                        //console.log(reply)
                        var proxy2 = EventProxy.create('author', 'r_author', function(author, rAuthor) {
                            reply = reply.toObject({hide: 'post_id author_id at_user_id', transform: true});
                            reply.create_at = tools.dateFormat(reply.create_at, 'YYYY 年 MM 月 DD 日 hh:mm:ss');
                            reply.author = author;
                            if(rAuthor) reply.reply_author = rAuthor;
                            replies[j] = reply;
                            tools.marked(reply.content, function(err, content) {
                                if(!err) reply.content = content;
                                ep2.emit('users_find');
                            });
                        }).fail(function(err) {ep2.emit('error', err);});

                        findAuthor(reply.author_id, function(err, doc) {
                            if(err) return proxy2.emit('error', err);
                            proxy2.emit('author', doc);
                        });

                        if(reply.at_user_id) {
                            findAuthor(reply.at_user_id, function(err, doc) {
                                if(err) return proxy2.emit('error', err);
                                proxy2.emit('r_author', doc);
                            });
                        } else {
                            proxy2.emit('r_author', null);
                        }
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
                {id: 'yy', replies: [], reply_author: {}, author: {}}
            ]
        }
    ]*/
}

function removeCommentsByPostId(postid, callback) {
    Comment.find({post_id: postid}, function(err, doc) {
        if(err) return callback(err);
        if(!doc.length) return callback(null);
        async.each(doc, function(comment, cb) {
            comment.remove(cb);
        }, callback);
    });
}

exports.add = function(req, res, next) {//console.log('session commit: ', req.session.user)
    var postid = req.body.postid || req.params.postid;
    var user = req.body.user || null;
    var sUser = user_ctrl.getSessionUser(req);
    var content = sanitize(req.body.content || '').trim();
    var replyId = req.body.reply_comment_id || '';
    var atUid = req.body.at_user_id || '';

    var checkUser = function(callback) {
        user = user_ctrl.infoCheck(user);
        if(user.error) return callback(user.error);

        user_ctrl.findOne({
            name: user.name
            , email: user.email
            , pass: user.pass
        }, function(err, doc) {
            if(err) return callback(err);

            if(!doc) {
                user_ctrl.addOne(user, callback);
            } else {
                callback(null, doc);
            }
        });
    };

    var emitErr = function(msg, err) {
        console.log(msg, err);
        proxy.emit('error', msg);
    };

    //content = sanitize(content).xss();// xss filter

    if(!user) return tools.jsonReturn(res, 'PARAM_MISSING', null, 'User info missing.');
    if(!content) return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Comment content null.');

    if(user.email !== admin.EMAIL) {
        user.pass = user_ctrl.md5(settings.DEFAULT_USER_PASS);
    } else {// for admin
        if(sUser && sUser.admin) {
            user.pass = sUser.pass;
        } else {
            return tools.jsonReturn(res, 'AUTH_ERROR', null, 'Admin need login first.');
        }
    }

    var proxy = EventProxy.create('user_check', 'at_user_check', function(author, at_author) {
        var comment = new Comment();
        comment.post_id = postid;
        comment.author_id = author._id;
        comment.content = content;

        if(replyId) comment.reply_id = replyId;
        if(at_author) comment.at_user_id = at_author._id;

        comment.save(function(err, doc) {
            if(err) {
                console.log('Add comment error. ', err);
                return tools.jsonReturn(res, 'DB_ERROR', null, 'Add comment error.');
            }
            doc = doc.toObject();
            doc.author = author;
            doc.reply_id = replyId;
            doc.reply_author = at_author;
            doc.create_at = tools.dateFormat(doc.create_at, 'YYYY 年 MM 月 DD 日 hh:mm:ss');
            tools.marked(doc.content, function(err, content) {
                if(!err) doc.content = content;
                tools.jsonReturn(res, 'SUCCESS', doc);
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
    }).fail(function(err) {
        console.log('Add comment error.', err);
        tools.jsonReturn(res, 'DB_ERROR', null, 'Add comment error.');
    });

    checkUser(function(err, doc) {
        if(err) return emitErr('Check user error on add comment.', err);
        doc = doc.toObject();
        doc.avatar = doc.avatar || user_ctrl.genAvatar(doc.email);
        //delete doc.pass;
        delete doc.create_at;
        delete doc.modify_at;
        //delete doc.email;
        /*user_ctrl.setCookie(res, doc);
        req.session.user = doc;*/
        user_ctrl.genSessionUser(res, doc);
        proxy.emit('user_check', doc);
    });

    if(atUid) {
        user_ctrl.findById(atUid, 'name email site', function(err, doc) {//console.log(666)
            if(err || !doc) return proxy.emit('at_user_check', null);
            doc = doc.toObject();
            doc.avatar = doc.avatar || user_ctrl.genAvatar(doc.email);
            delete doc.pass;
            delete doc.create_at;
            delete doc.modify_at;
            proxy.emit('at_user_check', doc);
        });
    } else {
        proxy.emit('at_user_check', null);
    }
}

exports.findAllByPostId = function(req, res, next) {
    var postid = req.body.postid || req.params.postid;
    var user = user_ctrl.getSessionUser(req);

    if(!postid) {
        return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Param postid required.');
    }

    findCommentsByPostId(postid, function(err, comments) {
        if(err) return tools.jsonReturn(res, 'DB_ERROR', null, 'Find comments error.');
        if(user) {
            // delete pass, email and name etc
            user = {
                _id: user._id,
                admin: user.admin
            }
        }
        tools.jsonReturn(res, 'SUCCESS', {user: user, comments: comments});
    });
}

exports.remove = function(req, res, next) {
    var postid = req.body.postid || req.params.postid;
    var commentId = req.body.commentid || req.params.commentid;
    var user = user_ctrl.getSessionUser(req);

    if(!postid) {
        return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Param postid required.');
    }

    Comment.findOne({_id: commentId, post_id: postid}, function(err, doc) {
        if(err) {
            console.log('Remove comment error.', err);
            return tools.jsonReturn(res, 'DB_ERROR', null, 'Remove comment error.');
        }

        if(!doc) return next(404);
        if(user && (user.admin || doc.author_id.toString() === user._id.toString())) {
            /*Comment.findByIdAndRemove(doc._id, function(err, doc) {
                if(err) return tools.jsonReturn(res, 'DB_ERROR', null, 'Remove comment error.');
                tools.jsonReturn(res, 'SUCCESS', 0);
            });*/
            doc.remove(function(err, doc) {
                if(err || doc) return tools.jsonReturn(res, 'DB_ERROR', null, 'Remove comment error.');
                tools.jsonReturn(res, 'SUCCESS', 0);

                post_ctrl.findByIdAndUpdate(postid, {
                    $inc: {comments: -1}
                }, function(err) {
                    if(err) console.log('Update post error.', err);
                });
            });
        } else {
            next(403);
        }
    });
    //Comment.find({_id: commentId, post_id: postid}).or([{author_id: user._id}])
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;
exports.removeCommentsByPostId = removeCommentsByPostId;
