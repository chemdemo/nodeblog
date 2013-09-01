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
	var tag = req.query.tag;

	if(!tag) {
		console.log('Param tag required');
		return next();
	}

	Tag.find({name: tag}, function(err, doc) {
		if(err || !doc) return next();

		var postids = doc.postids || [];
		if(postids.length > 0) {
			post_ctrl.fetchPosts(postids, '_id title summary author_id', function(err, r) {
				if(err) return next(err);
				console.log('Fetch posts by tag success!');
				//res.render('list', {result: r});
			});
		} else {
			console.log('No posts found.');
			//res.render('list',{result: []});
		}
	});
}

//exports.addOne = addOne;
//exports.addPost = addPost;
exports.findAllTags = findAllTags;
exports.addTags4Post = addTags4Post;
exports.removePost4Tags = removePost4Tags;