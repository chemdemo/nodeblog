var settings = require('../../settings');
var rcodes = settings.RCODES;
var models = require('../models');
var Post = models.Post;

var user_ctrl = require('./user');
var tag_ctrl = require('./tag');
var comment_ctrl = require('./comment');

var async = require('async');

function findById(postid, fields, callback) {
	Post.findById(postid, fields, function(err, doc) {
		if(err) {
			callback(err);
		} else {
			var aid = doc.author_id;
			//var lastComment = doc.last_comment_by;
			if(aid) {
				user_ctrl.findById(aid, function(_err, _doc) {
					if(!_err) {
						doc.author = _doc || {};
						callback(null, doc);
					} else {
						callback({
							rcode: rcodes['DB_ERROR'],
							errinfo: 'User was not found.'
						});
					}
				});
			} else {
				callback({
					rcode: rcodes['DB_ERROR'],
					errinfo: 'Author_id was not found.'
				});
			}
		}
	});
}

function fetchPosts(postids, callback) {
	async.map(postids, function(postid, _callback) {
		findById(postid, '');
	}, callback);
}

function getRandomCover() {
	return '/web/covers/c0.jpg';
}

exports.addOne = function(req, res, next) {
	var user = req.session.user;
	var title = req.body.title;
	var content = req.body.body;
	var summary = req.body.summary || '';
	var cover = req.body.cover_url || getRandomCover();
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
	post.cover = cover;
	post.top = top;
	post.author_id = user._id;
	post.setSummary(summary);

	post.save(function(err, doc) {
		if(err) {
			req.flash('error', 'Post error!');
			console.log(err);
			return res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		}
		//req.flash('success', 'Post success!');
		//res.redirect('/post/' + doc._id);
		tag_ctrl.addTags4Post(tags, doc._id, function(err, r) {
			console.log(err, r);

			res.json({
				rcode: rcodes['SUCCESS'],
				result: doc
			});
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
			//res.render('edit', doc);
			res.json({
				rcode: rcodes['SUCCESS'],
				result: doc
			});
		} else {
			console.log(err);
			next(404);
		}
	});
}

exports.updateOne = function(req, res, next) {
	var postid = req.body.postid;
	var update = JSON.parse(req.body.update || null);

	if(!update) {
		return next();
	}

	update.update_at = Date.now();

	Post.findByIdAndUpdate(postid, update, function(err, doc) {
		if(!err && doc) {
			res.json({
				rcode: rcodes['SUCCESS'],
				result: doc
			});
			//res.render('post', doc);
		} else {
			res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		}
	});
}

// post按月归档统计
// see --> http://mongoosejs.com/docs/api.html#model_Model.mapReduce
exports.postPlaced = function(req, res, next) {
	var mapFn = function() {
		var create = new Date(this.create_at);
		var month = new Date(create.getFullYear(), create.getMonth());
		emit(month, this._id);
	};

	var r = {};
	var reduceFn = function(month, postid) {//{20130500: ['xxx', 'xxxx']}
		//var r = {};
		r[month] = r[month] || (r[month] = []);
		r[month].push(postid);
		return r;
	};

	var finalizeFn = function() {
		;
	};

	Post.mapReduce({
		map: mapFn,
		reduce: reduceFn,
		out: {replace: 'post_placed_result'},
		query: {create_at: {$gt: new Date('01/01/2013')}},
		//finalize: finalizeFn,
		verbose: true
	}, function(err, model, stats) {
		console.log('map reduce took %d ms', stats.processtime);
		if(err) {
			console.log(err);
			res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		} else {
			model.find().exec(function(_err, doc) {
				if(_err) {
					res.json({
						rcode: rcodes['DB_ERROR'],
						errinfo: _err
					});
				} else {
					res.json({
						rcode: rcodes['SUCCESS'],
						result: r
					});
				}
			});
		}
	});
}

exports.findById = findById;
exports.fetchPosts = fetchPosts;