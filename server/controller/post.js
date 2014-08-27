var settings = require('../../settings');
var itemLimit = settings.ITEM_PER_PAGE;

var models = require('../models');
var Post = models.Post;
var user_ctrl = require('./user');
var tag_ctrl = require('./tag');
var comment_ctrl = require('./comment');

var tools = require('../utils/tools');
var validator = require('validator');
var xss = require('xss');
var async = require('async');
var EventProxy = require('eventproxy');
var _ = require('underscore');

function findById(postid, fields, callback) {
    Post.findById(postid, fields, callback);
}

function findByIdAndUpdate(postid, update, callback) {
    Post.findByIdAndUpdate(postid, update, callback);
}

function getRandomCover() {
    return '/web/covers/c0.jpg';
}

function findAPost(postid, fields, callback) {
    Post.findById(postid, fields, function(err, doc) {
        if(err || !doc) return callback(err);

        doc = doc.toObject();
        var proxy = EventProxy.create('author_find', 'last_commentator_find', function(author, commentator) {
            doc.author = author;
            doc.last_commentator = commentator;
            //doc.update_date = tools.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss')
            callback(null, doc);
        }).fail(callback);

        if(fields.indexOf('author_id') > -1) {
            user_ctrl.findById(doc.author_id, 'name email site', function(_err, _doc) {
                if(_err || !_doc) return proxy.emit('error', _err);
                _doc = _doc.toObject();
                _doc.avatar = _doc.avatar || user_ctrl.genAvatar(_doc.email);
                //delete _doc.email;
                proxy.emit('author_find', _doc);
            });
        } else {
            proxy.emit('author_find', null);
        }

        if(fields.indexOf('last_comment_by') > -1 && doc.last_comment_by) {
            user_ctrl.findById(doc.last_comment_by, 'name email site', function(_err, _doc) {
                if(_err || !_doc) return proxy.emit('error', _err);
                _doc = _doc.toObject();
                _doc.avatar = _doc.avatar || user_ctrl.genAvatar(_doc.email);
                //delete _doc.email;
                proxy.emit('last_commentator_find', _doc);
            });
        } else {
            proxy.emit('last_commentator_find', null);
        }
    });
}

function fetchPosts(postids, fields, callback) {
    async.map(postids, function(postid, _callback) {
        findAPost(postid, fields, _callback);
    }, callback);
}

function fetchByPage(start, offset, callback) {
    offset = Math.min(offset, itemLimit);
    Post.find(null, 'title summary author_id update_at tags comments visite topped')
        .sort({topped: -1, create_at: -1})
        .skip(start)
        .limit(offset)
        .exec(function(err, doc) {
            if(err) {
                console.log('Fetch posts by page error, err: ', err);
                return callback(err);
            }

            async.map(doc, function(item, cb) {
                /*var proxy = EventProxy.create('got_author', 'build', function(author, summary) {
                    item.author = author;
                    item.summary = summary;
                    item.update_date = tools.dateFormat(item.update_at, 'YYYY-MM-DD');
                    cb(null, item);
                }).fail(cb);

                user_ctrl.findById(item.author_id, function(_err, _doc) {
                    if(_err) {
                        console.log('Find author error, err: ', _err);
                        return proxy.emit('error', _err);
                    }
                    proxy.emit('got_author', _doc);
                });*/

                //item.update_date = tools.dateFormat(item.update_at, 'YYYY-MM-DD hh:mm');
                item = item.toObject();
                tools.marked(item.summary, function(_err, content) {
                    /*if(_err) {
                        console.log('Build summary error: ', _err);
                        return proxy.emit('build', item.summary);
                    }
                    proxy.emit('build', content);*/
                    if(!_err) {
                        item.summary = content;
                    } else {
                        console.log('Build summary error: ', _err);
                    }
                    cb(null, item);
                }, false);
            }, callback);
        });
}

// post按月归档统计，在post有增加或者删除的时候调用
// see --> http://mongoosejs.com/docs/api.html#model_Model.mapReduce
function countMonthy(callback) {
    var mapFn = function() {
        var create = this.create_at;
        var year = create.getFullYear();
        var month = create.getMonth() + 1;
        // month = ('0' + month).slice(-2);// prezero
        // var key = new Date(year, month).getTime() - 8*60*60*1000;
        var key = year + '/' + ('0' + month).slice(-2);
        // var v = this._id.toString().replace(/ObjectId\(\"(.+)\"\)/, '$1');
        // _id.toString() function is not work on mongodb V2.4
        var v = this._id.str;
        emit(key, v);
    };

    var reduceFn = function(key, values) {//{'2013/09': ['xxx', 'xxxx']}
        // return _.flatten(values);
        // var r = {postids: []};
        var r = [];
        values.forEach(function(v, i) {
            // r.postids.push(v.postid[0]);
            r.push(v);
        });
        return r.join('$');
    };

    var finalizeFn = function() {};

    Post.mapReduce({
        map: mapFn,
        reduce: reduceFn,
        out: {replace: 'count_monthy'},
        query: {create_at: {$gt: new Date('01/01/2013')}},
        // jsMode: true,
        keeptemp: true,
        // finalize: finalizeFn,
        verbose: true//,
        // scope: {_: _, console: console}
    }, function(err, model, stats) {
        console.log('MapReduce took %d ms.', stats.processtime);
        if(err) {
            console.log('Count posts error, err: ', err);
            return callback && callback(err);
        }
        callback && callback(null);

        // model.find().exec(function(err, doc) {
        //     callback(err, doc);
        //     if(err || !doc) console.log('Find result of mapReduce error: ', err, doc);
        // });
    });
}

// 查找post统计结果
function findCounts(conditions, callback) {
    try {
        var mongo = require('mongodb');
        var server = mongo.Server(settings.DB_HOST, settings.DB_PORT, {auto_reconnect: false});
        var db = new mongo.Db(settings.DB_NAME, server, {safe: false});

        db.open(function(err, dbConn) {
            if(err) {
                callback(err);
                db.close();
            } else {
                dbConn.collection('count_monthy', function(err, conn) {
                    if(err) {
                        callback(err);
                        db.close();
                    } else {
                        conn.find(conditions).toArray(function(err, doc) {
                            doc.sort(function(a, b) {
                                return new Date(b._id).getTime() - new Date(a._id).getTime();
                            });
                            callback(err, doc);
                            db.close();
                        });
                    }
                });
            }
        });
    } catch(e) {
        console.log('Mongodb connect error.', e);
        return callback(e);
    }
}

// get
exports.edit = function(req, res, next) {
    // var user = user_ctrl.getSessionUser(req);
    var postid = req.params.postid;

    if(postid) {
        var proxy = EventProxy.create('post', 'tags', function(post, tags) {
            if(req.xhr) {
                tools.jsonReturn(res, 'SUCCESS', {content: post.content, summary: post.summary});
            } else {
                delete post.content;
                delete post.summary;
                res.render('edit', {post: post, tags: tags});
            }
        }).fail(next);

        findById(postid, 'title content summary tags topped', function(err, doc) {
            if(!err && doc) {
                proxy.emit('post', doc);
            } else {
                proxy.emit('error', err || 'Post not found.');
            }
        });

        tag_ctrl.findAllTags(function(err, doc) {
            if(err) console.log('Find tags error, ', err);
            proxy.emit('tags', doc || []);
        });
    } else {
        tag_ctrl.findAllTags(function(err, doc) {
            if(err) console.log('Find tags error, ', err);
            res.render('edit', {tags: doc});
        });
    }
}

function _extend(doc, data) {
    var fields = ['title', 'content', 'cover', 'summary', 'tags', 'topped'];
    if(data.tags) data.tags = _.without(_.uniq(data.tags), '');

    _(fields).each(function(field) {
        if(data[field] !== 'undefined') {
            if('topped' === field) data[field] -= 0;// convert to Number
            doc[field] = data[field];
        }
    });

    //doc.setSummary(doc.summary);
    doc.update_at = new Date();

    return doc;
}

exports.create = function(req, res, next) {
    var user = user_ctrl.getSessionUser(req);
    var fields = ['title', 'content', 'cover', 'summary', 'tags', 'topped'];
    var data = JSON.parse(req.body.data || null) || {};
    var post;

    if(!data.title || !data.content) {
        console.log('Both title and content were required.');
        return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Both title and content were required.');
    }

    //if(data.tags) data.tags = _.without(data.tags, '');
    post = new Post();
    post = _extend(post, data);
    post.setSummary(data.summary);
    post.create_at = new Date();
    post.author_id = user._id;

    post.save(function(err, doc) {
        if(err) {
            console.log('Create post error, err: ', err);
            return tools.jsonReturn(res, 'DB_ERROR', null, 'Create post error.');
        }

        if(doc.tags && doc.tags.length) {
            tag_ctrl.addTags4Post(doc.tags, doc._id, function(err, r) {
                if(err) console.log('Add tags for post error, err: ', err);
            });
        }

        // res.redirect will not work if the method is post by ajax
        //return res.redirect(302, '/post/' + doc._id);
        /*var data = JSON.stringify('/post/' + doc._id);
        res.contentType('application/json');
        res.header('Content-Length', data.length);
        res.end(data);*/
        //console.log(doc._id)
        tools.jsonReturn(res, 'SUCCESS', doc._id);
        countMonthy(function(err) {if(err) console.log('Count posts error.', err);});
    });
}

exports.update = function(req, res, next) {
    var postid = req.params.postid;
    var fields = ['title', 'content', 'cover', 'summary', 'tags', 'topped'];
    var update = JSON.parse(req.body.update || null);

    if(!postid) return next(404);
    if(!update) return tools.jsonReturn(res, 'SUCCESS', postid);

    Post.findById(postid, fields.join(' '), function(err, doc) {
        if(err || !doc) return next(err);

        var docTags = doc.tags || [];
        var dataTags;
        var arrAdd = [];
        var arrDel = [];
        if(update.tags) {
            dataTags = _.uniq(update.tags);
            arrAdd = _.without(_.difference(dataTags, docTags), '');
            arrDel = _.without(_.difference(docTags, dataTags), '');
        }
        //console.log('arrAdd: ', arrAdd);
        //console.log('arrDel: ', arrDel);
        var proxy = EventProxy.create('tags_deleted', 'tags_saved', function() {
            Post.findByIdAndUpdate(doc._id, update, function(err, doc) {
                if(err || !doc) return tools.jsonReturn(res, 'DB_ERROR', null, 'Update post error.');
                tools.jsonReturn(res, 'SUCCESS', doc._id);
            });
            /*doc = _extend(doc, update);
            doc.save(function(err, doc) {
                if(err || !doc) return tools.jsonReturn(res, 'DB_ERROR', null, 'Update post error.');
                tools.jsonReturn(res, 'SUCCESS', doc._id);
            });*/
        }).fail(function(err) {
            console.log('Set tags error, err', err);
            //next(err);
            tools.jsonReturn(res, 'DB_ERROR', null, 'Set tags error.');
        });

        if(arrDel.length) {
            tag_ctrl.removePost4Tags(arrDel, postid, function(err) {
                if(err) {
                    console.log('Remove tags error.');
                    return proxy.emit('error');
                }
                proxy.emit('tags_deleted');
            });
        } else {
            proxy.emit('tags_deleted');
        }

        if(arrAdd.length) {
            tag_ctrl.addTags4Post(arrAdd, postid, function(err) {
                if(err) {
                    console.log('Add tags error.');
                    return proxy.emit('error');
                }
                proxy.emit('tags_saved');
            });
        } else {
            proxy.emit('tags_saved');
        }
    });
}

exports.remove = function(req, res, next) {
    var user = user_ctrl.getSessionUser(req);
    var postid = req.body.postid || req.params.postid;
    var fields = 'tags comments';

    if(!postid) return next();

    Post.findOne({_id: postid, author_id: user._id}, fields, function(err, doc) {
        //Post.findByIdAndRemove
        if(err || !doc) return next(err);

        //var proxy = EventProxy.create('rm_tags', 'rm_comments', function() {
        doc.remove(function(err) {
            if(err) {
                console.log('Remove post error.', err);
                return tools.jsonReturn(res, 'DB_ERROR', null, 'Remove post error.');
            }
            countMonthy(function(err) {'Count posts error.', err});
            tools.jsonReturn(res, 'SUCCESS', 'ok');
        });
        //});

        // delete this post from tags
        if(doc.tags && doc.tags.length) {
            tag_ctrl.removePost4Tags(doc.tags, doc._id, function(err) {
                //proxy.emit('rm_tags');
                if(err) console.log('Remove tags error when remove post.', err);
            });
        }/* else {
            proxy.emit('rm_tags');
        }*/

        // delete comments
        if(doc.comments) {
            comment_ctrl.removeCommentsByPostId(doc._id, function(err) {
                //proxy.emit('rm_comments');
                if(err) console.log('Remove comments error when remove post.', err);
            });
        }/* else {
            proxy.emit('rm_comments');
        }*/
    });
}

exports.show = function(req, res, next) {
    var postid = req.params.postid;
    var user = user_ctrl.getSessionUser(req);

    if(!postid) return next(new Error('Param `postid` required.'));

    var fields = 'i title create_at update_at author_id tags comments visite topped';

    //findAPost
    var proxy = EventProxy.create('post', 'tags', 'counts', 'prev', 'next', function(post, tags, counts, prev, next) {
        Post.findByIdAndUpdate(post._id, {$inc: {visite: 1}}, function(_err, _doc) {
            if(_err) console.log('Add visite error.', _err);
        });

        res.render('post', {
            post: post
            , tags: tags
            , counts: counts
            , prev: prev
            , next: next
            , user: user
        });

        // res.render()修改了post._id，会导致visite更新不成功！
        // Post.findByIdAndUpdate(post._id, {$inc: {visite: 1}}, function(_err, _doc) {
        //     if(_err) console.log('Add visite error.', _err);
        // });
    }).fail(next);

    proxy.on('post', function(post) {
        // find prev
        Post.findOne({i: {$lt: post.i}}, 'title')
            .sort('-i')
            .exec(function(err, doc) {
                proxy.emit('prev', doc || {});
                if(err) console.log('Find previous post error, ', err);
            });

        // find next
        Post.findOne({i: {$gt: post.i}}, 'title')
            .sort('i')
            .exec(function(err, doc) {
                proxy.emit('next', doc || {});
                if(err) console.log('Find next post error, ', err);
            });
    });

    findAPost(postid, fields, function(err, doc) {
        if(err || !doc) return proxy.emit('error', err);
        doc.visite ++;//console.log('post: ', doc)
        proxy.emit('post', doc);
    }, false);

    tag_ctrl.findAllTags(function(err, doc) {
        if(err) return proxy.emit('error', err);
        proxy.emit('tags', doc);
    });

    findCounts(null, function(err, doc) {
        if(err) return proxy.emit('error', err);
        proxy.emit('counts', doc);
    });
}

// 单独拉取content, 配合show
exports.getPostContent = function(req, res) {// for ajax
    var postid = req.query.postid || req.params.postid;
    var type = req.query.type || 'markdown';
    var summary = req.query.summary || false;
    var fields = 'content';

    if(summary) fields += ' summary';

    findAPost(postid, fields, function(err, doc) {
        if(err) {
            console.log('Get post content error.', err);
            return tools.jsonReturn(res, 'DB_ERROR', null, 'Get post content error.');
        }
        //doc = doc.toObject();
        delete doc._id;
        if('html' === type) {// html
            tools.marked(doc.content, function(err, content) {
                if(!err) {
                    doc.content = content;
                } else {
                    console.log('Build html error, err: ', err);
                }
                tools.jsonReturn(res, 'SUCCESS', doc.content);
            }, false);// 不过滤html标签
        }
        if('markdown' === type) {
            tools.jsonReturn(res, 'SUCCESS', doc);
        }
    });
}

exports.showByPage = function(req, res, next) {
    // page从0开始
    var page = (req.query.page - 0) || 0;
    fetchByPage(page*itemLimit, itemLimit, function(err, r) {
        if(err) return tools.jsonReturn(res, 'DB_ERROR', '', err);
        tools.jsonReturn(res, 'SUCCESS', r);
    });
}

exports.counts = function(req, res, next) {
    var user;
    var year = req.params.year;
    var month = req.params.month;
    var fields = '_id title author_id topped update_at visite';
    var pageTitle = '';
    var postids;

    //year -= 0;
    //month -= 0;
    month = ('0' + month).slice(-2);
    if(!year || !month) return next();

    //pageTitle = tools.dateFormat(new Date(year, month-1), 'YYYY年MM月') + '文章归档';
    pageTitle = year + '年' + month + '月文章归档';

    findCounts({_id: year + '/' + month}, function(err, doc) {
        if(err) return next(err);
        if(!doc.length) return res.render('list', {posts: [], page_title: pageTitle});
        postids = doc[0].value.split('$');//console.log(postids)
        fetchPosts(postids, fields, function(err, doc) {
            if(err) return next(err);
            user = user_ctrl.getSessionUser(req);
            res.locals.user = user;
            res.render('list', {posts: doc, page_title: pageTitle, user: user});
        });
    });
}

exports.search = function(req, res, next) {
    var user;
    var keyword = validator.trim(req.body.keyword || '');
    var fields = '_id title author_id topped update_at visite';
    var pageTitle = '所有含<b class="list-key"> ' + req.body.keyword + '</b> 的文章';

    if(!keyword) return res.render('list', {posts: [], page_title: pageTitle});

    keyword = xss(keyword);
    Post.find(null, '_id')
        .$where('(/' + keyword + '/ig.test(this.title))')
        .exec(function(err, doc) {
            if(err) return next(err);
            if(!doc.length) return res.render('list', {posts: [], page_title: pageTitle});
            fetchPosts(_.filter(doc, function(item) {return item._id}), fields, function(err, doc) {
                if(err) return next(err);
                user = user_ctrl.getSessionUser(req);
                res.locals.user = user;
                res.render('list', {posts: doc, page_title: pageTitle, user: user});
            });
        });
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;
exports.fetchPosts = fetchPosts;
exports.fetchByPage = fetchByPage;
exports.countMonthy = countMonthy;
exports.findCounts = findCounts;

module.exports = exports;
