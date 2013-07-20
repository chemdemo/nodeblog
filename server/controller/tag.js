var settings = require('../../settings');
var rcodes = settings.RCODES;
var models = require('../models');
var Tag = models.Tag;
var post_ctrl = require('./post');
var async = require('async');

/*function findById(id, callback) {
	Tag.findById(id, callback);
}*/

function findOne(name, callback) {
	Tag.findOne({name: name}, callback);
}

function addOne(name, callback) {
	var tag = new Tag();
	tag.name = name;
	tag.postids = [];
	tag.save(callback);
}

function addPost(tag, postid, callback) {
	findOne(tag, function(err, doc) {
		if(err) {
			//callback(err);
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
	async.map(tags, function(tag, _callback) {
		addPost(tag, postid, _callback);
		/*findOne(tag, function(err, doc) {
			if(err) {
				addOne(tag, _callback);
			} else {
				//_callback(null, doc);
				_callback(err, doc);
			}
		});*/
	}, callback);
}

function removePost(tag, postid, callback) {
	findOne(tag, function(err, doc) {
		if(err) {
			callback(err);
		} else {
			var postids = doc.postids || [];
			var index = postids.indexOf(postid);
			if(index > -1) {
				postids.splice(index, 1);
				doc.save(callback);
			} else {
				callback(null);
			}
		}
	});
}

exports.findPostsByTag = function(req, res, next) {
	var tag = req.query.tag;

	if(!tag) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Param tag required.'
		});
	}

	Tag.find({name: tag}, function(err, doc) {
		if(err) {
			res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		} else {
			/*callback({
				rcode: rcodes['SUCCESS'],
				result: doc.postids
			});*/
			var postids = doc.postids || [];
			post_ctrl.fetchPosts(postids, function(err, r) {
				if(err) {
					res.json({
						rcode: rcodes['DB_ERROR'],
						errinfo: err
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

//exports.addOne = addOne;
//exports.addPost = addPost;
exports.addTags4Post = addTags4Post;
exports.removePost = removePost;