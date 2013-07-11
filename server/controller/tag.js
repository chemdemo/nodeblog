var settings = require('../../settings');
var rcodes = settings.RCODES;
var models = require('../models');
var Tag = models.Tag;

function findById(id, callback) {
	Tag.findById(id, callback);
}

function findOne(name, callback) {
	Tag.findOne({name: name}, callback);
}

function addOne(name, callback) {
	var tag = new Tag();
	tag.name = name;
	tag.postids = [];
	tag.save(callback);
}

function addPost(tagid, postid, callback) {
	findById(tagid, function(err, doc) {
		if(err) {
			callback(err);
		} else {
			var postids = doc.postids || [];
			if(postids && postids.indexOf(postid) > -1) {
				callback(null);
			} else {
				doc.postids.push(postid);
				doc.save(callback);
			}
		}
	});
}

function removePost(tagid, postid, callback) {
	findById(tagid, function(err, doc) {
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
	var tagid = req.query.tagid;

	if(!tagid) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Param tagid required.'
		});
	}

	Tag.find({_id: tagid}, function(err, doc) {
		if(err) {
			res.json({
				rcode: rcodes['DB_ERROR'],
				errinfo: err
			});
		} else {
			callback({
				rcode: rcodes['SUCCESS'],
				result: doc.postids
			});
		}
	});
}

exports.addOne = addOne;
exports.addPost = addPost;
exports.removePost = removePost;