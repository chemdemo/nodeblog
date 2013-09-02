var settings = require('../../settings');
var itemLimit = settings.ITEM_PER_PAGE;

var models = require('../models');
var Post = models.Post;
var user_ctrl = require('./user');
var tag_ctrl = require('./tag');
var comment_ctrl = require('./comment');

var tools = require('../utils/tools');
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
	findById(postid, fields, function(err, doc) {
		if(err || !doc) return callback(err);

		var proxy = EventProxy.create('author_find', 'last_commentator_find', function(author, commentator) {
			doc.author = author;
			doc.lastCommentator = commentator;
			//doc.update_date = tools.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss')
			callback(null, doc);
		}).fail(callback);

		if(fields.indexOf('author_id') > -1) {
			user_ctrl.findById(doc.author_id, function(_err, _doc) {
				if(_err) return proxy.emit('error', _err);
				proxy.emit('author_find', _doc);
			});
		} else {
			proxy.emit('author_find', null);
		}
		
		if(fields.indexOf('last_comment_by') > -1 && doc.last_comment_by) {
			user_ctrl.findById(doc.last_comment_by, function(_err, _doc) {
				if(_err) return proxy.emit('error', _err);
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
		.sort('topped -create_at')
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
				});
			}, callback);
		});
}

// post按月归档统计，在post有增加或者删除的时候调用
// see --> http://mongoosejs.com/docs/api.html#model_Model.mapReduce
function countMonthy(callback) {
	var mapFn = function() {
		var create = this.create_at;
		var year = create.getFullYear();
		var month = create.getMonth()+1;
		month = ('0' + month).slice(-2);
		var key = new Date(create.getFullYear(), create.getMonth()+1).getTime();
		//var key = year + '年' + month + '月';
		//emit(key, {postid: [this._id]});
		emit(key, this._id.toString());
	};

	var reduceFn = function(key, values) {//{'20130500': ['xxx', 'xxxx']}
		//return _.flatten(values);
		//var r = {postids: []};
		var r = [];
		values.forEach(function(v, i) {
			//r.postids.push(v.postid[0]);
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
		//jsMode: true,
		keeptemp: true,
		//finalize: finalizeFn,
		verbose: true//,
		//scope: {_: _, console: console}
	}, function(err, model, stats) {
		console.log('MapReduce took %d ms.', stats.processtime);
		if(err) {
			console.log('Count posts error, err: ', err);
			return callback && callback(err);
		}
		callback && callback(null);

		/*model.find().exec(function(err, doc) {
			callback(err, doc);
			if(err || !doc) console.log('Find result of mapReduce error: ', err, doc);
		});*/
	});
}

// 查找post统计结果
function findCounts(callback) {
	try {
		var mongo = require('mongodb');
		var server = mongo.Server(settings.DB_HOST, settings.DB_PORT, {auto_reconnect: true});
		var db = new mongo.Db(settings.DB_NAME, server, {safe: false});

		db.open(function(err, dbConn) {
			if(err) return callback(err);
			dbConn.collection('count_monthy', function(err, conn) {
				if(err) return callback(err);
				conn.find().toArray(callback);
			});
		});
	} catch(e) {
		console.log('Mongodb connect error.', e);
		return callback(e);
	}
}

exports.edit = function(req, res, next) {// get
	var user = req.session.user;
	var postid = req.params.postid;
	
	if(postid) {
		var fields = '_id title content summary tags topped';
		findById(postid, fields, function(err, doc) {
			if(!err && doc) {
				res.render('edit', doc);
			} else {
				console.log('Find post error, err: ', err);
				next(err);
			}
		});
	} else {
		res.render('edit', {});
	}
}

exports.save = function(req, res, next) {
	var user = req.session.user;
	var postid = req.params.postid;
	var fields = ['_id', 'title', 'content', 'cover', 'summary', 'tags', 'topped'];

	function _extend(doc, data) {
		if(data.tags) data.tags = _.without(_.uniq(data.tags), '');

		_(fields).each(function(field) {
			if(data[field]) {
				if('topped' === field) data[field] -= 0;// convert to Number
				doc[field] = data[field];
			}
		});

		doc.setSummary(doc.summary);
		doc.update_at = Date.now();

		return doc;
	}

	if(postid) {// update
		var data = JSON.parse(req.body.data || null);
		
		if(!data) return next();

		Post.findById(postid, fields.join(' '), function(err, doc) {
			if(err || !doc) return next(err);

			var dataTags = _.uniq(data.tags || []);
			var docTags = doc.tags || [];
			var arrAdd = _.without(_.difference(dataTags, docTags), '');
			var arrDel = _.without(_.difference(docTags, dataTags), '');

			//console.log('arrAdd: ', arrAdd);
			//console.log('arrDel: ', arrDel);

			var proxy = EventProxy.create('tags_deleted', 'tags_saved', function() {
				doc = _extend(doc, data);
				//delete doc._id;
				doc.save(function(err, doc) {
					if(err || !doc) return tools.jsonReturn(res, 'DB_ERROR', null, 'Update post error.');
					//res.redirect('/post/' + doc._id);
					tools.jsonReturn(res, 'SUCCESS', doc._id);
				});
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
	} else {// create
		var data = JSON.parse(req.body.data || null) || {};
		
		if(!data.title || !data.content) {
			console.log('Both title and content were required.');
			return tools.jsonReturn(res, 'PARAM_MISSING', null, 'Both title and content were required.');
		}

		if(data.tags) data.tags = _.without(data.tags, '');

		var post = new Post();
		post = _extend(post, data);
		post.create_at = Date.now();
		post.author_id = user._id;

		post.save(function(err, doc) {
			if(err) {
				console.log('Create post error, err: ', err);
				//return next(err);
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
			tools.jsonReturn(res, 'SUCCESS', doc._id);
			countMonthy(function(err) {if(err) console.log('Count posts error.', err);});
		});
	}
}

exports.remove = function(req, res, next) {
	var user = req.session.user;
	var postid = req.params.postid;
	var fields = '_id tags comments';

	if(!postid) return next();

	var _remove = function(doc) {
		doc.remove(function(err) {
			if(err) return console.log('Remove post error.', err);
			countMonthy(function(err) {'Count posts error.', err});
		});
	};

	Post.findOne({_id: postid, author_id: user._id}, fields, function(err, doc) {
		//Post.findByIdAndRemove
		if(err || !doc) return next(err);

		// delete this post from tags
		if(doc.tags && doc.tags.length) {
			tag_ctrl.removePost4Tags(doc.tags, doc._id, function(err) {
				if(err) return next(err);
				doc.remove();
			});
		} else {
			doc.remove();
		}

		// delete comments
		// TODO

		//doc.remove();
	});
}

exports.show = function(req, res, next) {
	var user = req.session.user;
	var postid = req.params.postid;

	if(!postid) return next();

	var fields = 'title content update_at author_id tags comments visite topped last_comment_at last_comment_by';
	
	//findAPost
	var proxy = EventProxy.create('post', 'tags', 'counts'/*, 'prev', 'next'*/, function(post, tags, counts/*, prev, next*/) {
		res.render('post', {
			post: post
			, tags: tags
			, counts: counts
			, user: user || {}
		});
	}).fail(next);

	findAPost(postid, fields, function(err, doc) {
		if(err || !doc) return proxy.emit('error', err);
		//doc.save(function(_err) {if(_err) console.log('Add visite error.');});
		doc = doc.toObject();
		//console.log(doc.content)
		tools.marked(doc.content, function(err, content) {
			if(!err) {
				doc.content = content;
			} else {
				console.log('Build html error, err: ', err);
			}
			//doc.update_at = tools.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss');
			//doc.update_date = tools.dateFormat(doc.update_at, 'YYYY-MM-DD');
			doc.visite ++;
			//console.log('post: ', doc)
			proxy.emit('post', doc);
		});

		Post.findByIdAndUpdate(postid, {$inc: {visite: 1}}, function(_err, _doc) {
			if(_err) console.log('Add visite error.', _err);
		});
	});

	tag_ctrl.findAllTags(function(err, doc) {
		if(err) return proxy.emit('error', err);
		proxy.emit('tags', doc);
	});
	
	findCounts(function(err, doc) {
		if(err) return proxy.emit('error', err);
		proxy.emit('counts', doc);
	});

	/*Post.findByIdAndUpdate(postid, {$inc: {visite: 1}}, function(err, doc) {
		if(err) return next(err);
		//return res.render('post', doc);
		tools.marked(doc.content,  function(err, content) {
			if(!err) {
				doc.content = content;
			} else {
				console.log('Build html error, err: ', err);
			}
			//doc.update_at = tools.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss');
			doc.update_date = tools.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss');
			res.render('post', doc);
		});
	});*/
}

exports.showByPage = function(req, res, next) {
	// page从0开始
	var page = (req.query.page-0) || 0;
	fetchByPage(page*itemLimit, itemLimit, function(err, r) {
		if(err) return tools.jsonReturn(res, 'DB_ERROR', '', err);
		tools.jsonReturn(res, 'SUCCESS', r);
	});
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;
exports.fetchPosts = fetchPosts;
exports.fetchByPage = fetchByPage;
exports.countMonthy = countMonthy;
exports.findCounts = findCounts;