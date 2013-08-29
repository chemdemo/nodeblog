var settings = require('../../settings');
var rcodes = settings.RCODES;
var itemLimit = settings.ITEM_PER_PAGE;
var models = require('../models');
var Post = models.Post;

var user_ctrl = require('./user');
var tag_ctrl = require('./tag');
var comment_ctrl = require('./comment');

var utils = require('./utils');
var async = require('async');
var EventProxy = require('eventproxy');
var _ = require('underscore');
var marked = require('marked');
var hljs = require('highlight.js');

function findById(postid, fields, callback) {
	Post.findById(postid, fields, callback);
}

function findByIdAndUpdate(postid, update, callback) {
	Post.findByIdAndUpdate(postid, update, callback);
}

function getRandomCover() {
	return '/web/covers/c0.jpg';
}

function fetchPosts(postids, fields, callback) {
	function findAPost(id, fields, callback) {
		Post.findById(id, fields, function(err, doc) {
			if(err) return callback(err);

			if(_.contains(fields, 'author_id')) {
				var aid = doc.author_id;
				user_ctrl.findById(aid, function(_err, _doc) {
					if(_err) return callback(_err);
					doc.author = _doc;
					callback(null, doc);
				});
			} else {
				callback(null, doc);
			}
		});
	}

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
				var proxy = EventProxy.create('got_author', 'build', function(author, summary) {
					item.author = author;
					item.summary = summary.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
					item.update_date = utils.dateFormat(item.update_at, 'YYYY-MM-DD hh:mm:ss');
					cb(null, item);
				}).fail(cb);

				user_ctrl.findById(item.author_id, function(_err, _doc) {
					if(_err) {
						console.log('Find author error, err: ', _err);
						return proxy.emit('error', _err);
					}
					proxy.emit('got_author', _doc);
				});

				marked(item.summary, {
					highlight: function (code, lang) {
						if(lang) {
							return hljs.highlight(lang, code).value;
						}
						return hljs.highlightAuto(code).value;
					},
					breaks: true,
					pedantic: true,
					sanitize: true,
					smartypants: true
				}, function(_err, content) {
					if(_err) {
						console.log('Build summary error: ', _err);
						//return proxy.emit('error', err);
						return proxy.emit('build', item.summary);
					}
					proxy.emit('build', content);
				});
			}, callback);
		});
}

// post按月归档统计
// see --> http://mongoosejs.com/docs/api.html#model_Model.mapReduce
function countMonthy(callback) {
	var mapFn = function() {
		var create = this.create_at;
		var month = new Date(create.getFullYear(), create.getMonth()).getTime();
		emit(month, [this._id]);
	};

	var reduceFn = function(key, values) {//{'20130500': ['xxx', 'xxxx']}
		return _.flatten(values);
	};

	var finalizeFn = function() {};

	Post.mapReduce({
		map: mapFn,
		reduce: reduceFn,
		out: {replace: 'post_placed_result'},
		query: {create_at: {$gt: new Date('01/01/2013')}},
		keeptemp: true,
		//finalize: finalizeFn,
		verbose: true
	}, function(err, model, stats) {
		console.log('MapReduce took %d ms', stats.processtime);
		if(err) {
			console.log('Count posts error, err: ', err);
			return callback(err);
		}

		model.find().exec(function(err, doc) {
			callback(err, doc);
			if(err) console.log('Find result of mapReduce error: ', err, doc);
		});
	});
}

exports.edit = function(req, res, next) {// get
	var user = req.session.user;
	var postid = req.params.postid;
	
	if(postid) {
		var fields = '_id title content summary tags topped';
		Post.findById(postid, fields, function(err, doc) {
			if(!err && doc) {
				res.render('edit', doc);
			} else {
				console.log('Find post error, err: ', err);
				next();
			}
		});
	} else {
		res.render('edit', {});
	}
}

exports.save = function(req, res, next) {
	var user = req.session.user;
	var postid = req.params.postid;

	function _extend(doc, data) {
		var fields = ['title', 'content', 'cover', 'summary', 'tags', 'topped'];

		if(data.tags) data.tags = _.uniq(data.tags);

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
		var fields = '_id tags';

		if(!data) return next();

		Post.findById(postid, fields, function(err, doc) {
			if(err || !doc) return next();

			var dataTags = _.uniq(data.tags || []);
			var docTags = doc.tags || [];
			var arrAdd = _.difference(dataTags, docTags);
			var arrDel = _.difference(docTags, dataTags);

			var proxy = EventProxy.create('tags_deleted', 'tags_saved', function() {
				doc = _extend(doc, data);
				//delete doc._id;
				doc.save(function(err, doc) {
					console.log('Update post error, err', err);
					if(err || !doc) return next(err);
					res.redirect('/post/' + doc._id);
				});
			}).fail(function(err) {
				console.log('Set tags error, err', err);
				next(err);
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
			return res.json({
				rcode: rcodes['PARAM_MISSING'],
				errinfo: 'Both title and content were required.'
			});
		}

		var post = new Post();
		post = _extend(post, data);
		post.create_at = Date.now();
		post.author_id = user._id;

		post.save(function(err, doc) {
			if(err || !doc) {
				console.log('Create post error, err: ', err);
				return next(err);
			}
			res.redirect('/post/' + doc._id);

			if(doc.tags && doc.tags.length) {
				tag_ctrl.addTags4Post(doc.tags, doc._id, function(err, r) {
					if(err) console.log('Add tags for post error, err: ', err);
				});
			}
		});
	}
}

exports.remove = function(req, res, next) {
	var user = req.session.user;
	var postid = req.params.postid;
	var fields = '_id tags comments';

	if(!postid) return next();

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
	var postid = req.params.postid;

	if(!postid) return next();

	var fields = '_id title content update_at author_id tags comments visite topped last_comment_at last_comment_by';
	
	Post.findByIdAndUpdate(postid, {$inc: {visite: 1}}, function(err, doc) {
		if(err) return handleError(err);
		//return res.render('post', doc);
		marked(doc.content, {
			highlight: function (code, lang) {
				if(lang) {
					return hljs.highlight(lang, code).value;
				}
				return hljs.highlightAuto(code).value;
			},
			breaks: true,
			pedantic: true,
			sanitize: true,
			smartypants: true
		}, function(err, content) {
			if(!err) {
				doc.content = content;
			} else {
				console.log('Build html error, err: ', err);
			}
			doc.update_at = utils.dateFormat(doc.update_at, 'YYYY-MM-DD hh:mm:ss');
			res.render('post', doc);
		});
	});
}

exports.showByPage = function(req, res, next) {
	// page从0开始
	var page = (req.query.page-0) || 0;
	fetchByPage(page*itemLimit, itemLimit, function(err, r) {
		if(err) {
			return res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		}
		res.json({
			rcode: rcodes['SUCCESS'],
			result: r
		});
	});
}

exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;
exports.fetchPosts = fetchPosts;
exports.fetchByPage = fetchByPage;
exports.countMonthy = countMonthy;