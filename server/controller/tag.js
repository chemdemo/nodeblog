var settings = require('../../settings');

var models = require('../models');
var Tag = models.Tag;
var post_ctrl = require('./post');

var tools = require('../utils/tools');
var async = require('async');

/*function findById(id, callback) {
	Tag.findById(id, callback);
}*/

function addOne(name, callback) {
	var tag = new Tag();
	tag.name = name;
	tag.postids = [];
	tag.save(callback);
}

function findOne(name, callback) {
	Tag.findOne({name: name}, callback);
}

function removeOne(name, callback) {
	Tag.findOneAndRemove({name: name}, callback);
}

function addPost(tag, postid, callback) {
	findOne(tag, function(err, doc) {
		if(err) return callback(err);

		if(!doc) {
			addOne(tag, function(_err, _doc) {
				_doc.postids.push(postid);
				_doc.save(callback);
			});
		} else {
			var postids = doc.postids || [];
			if(postids.indexOf(postid) > -1) {
				callback(null);
			} else {
				doc.postids.push(postid);
				doc.save(callback);
			}
		}
	});
}

function addTags4Post(tags, postid, callback) {
	async.each(tags, function(tag, _callback) {
		addPost(tag, postid, _callback);
	}, callback);
}

function removePost(tag, postid, callback) {
	findOne(tag, function(err, doc) {
		if(err || !doc) {
			console.log('Tag %s find error.', tag);
			callback(err);
		} else {
			var postids = doc.postids || [];
			var index = postids.indexOf(postid);
			if(index > -1) {
				postids.splice(index, 1);
				doc.postids = postids;
				doc.save(function(err, doc) {
					callback(err);
					if(!err && doc && doc.postids.length === 0) {
						removeOne(tag, function(err) {
							if(err) console.log('Remove tag error.\ntag: %s\nerr: %s', tag, err);
						});
					}
				});
			} else {
				callback(null);
			}
		}
	});
}

function removePost4Tags(tags, postid, callback) {
	async.each(tags, function(tag, _callback) {
		removePost(tag, postid, _callback);
	}, callback);
}

function findAllTags(callback) {
	Tag.find(null, 'name').exec(function(err, doc) {
		if(err) {
			console.log('Find tags error, error: ', err);
			return callback(err);
		}

		callback(err, doc);
	});
}

exports.findPostsByTag = function(req, res, next) {
	var user;
	var tag = req.params.tag;
	var pageTitle = '所有含标签<b class="list-key"> ' + tag + ' </b>的文章';

	if(!tag) {
		console.log('Param tag required');
		return next();
	}

	Tag.findOne({name: tag}, function(err, doc) {
		if(err) return next(err);

		var postids = doc.postids || [];
		var fields = '_id title author_id topped update_at visite';
		if(postids.length > 0) {
			post_ctrl.fetchPosts(postids, fields, function(err, _doc) {
				if(err) return next(err);
				user = req.session.user || null;
				if(user) delete user.pass;
				res.render('list', {posts: _doc, page_title: pageTitle, user: user});
			});
		} else {
			res.render('list', {posts: [], page_title: pageTitle});
		}
	});
}

//exports.addOne = addOne;
//exports.addPost = addPost;
exports.findAllTags = findAllTags;
exports.addTags4Post = addTags4Post;
exports.removePost4Tags = removePost4Tags;