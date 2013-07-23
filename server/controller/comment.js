var settings = require('../../settings');
var rcodes = settings.RCODES;

var models = require('../models');
var Comment = models.Comment;
var post_ctrl = require('./post');
var user_ctrl = require('./user');

var sanitize = require('validator').sanitize;
var async = require('async');

exports.addOne = function(req, res, next) {
	var user = req.session.user || null;
	var postid = req.body.postid;
	var content = req.body.content;
	var name = req.body.name;
	var email = req.body.email;
	var site = req.body.site;

	var _add = function() {
		var comment = new Comment();
		comment.post_id = postid;
		comment.author_id = user._id;
		comment.content = content;
		comment.save(function(err, doc) {
			if(!err) {
				res.json({
					rcode: rcodes['SUCCESS'],
					result: doc
				});
			} else {
				console.log(err);
				res.json({
					rcode: rcodes['DB_ERROR'],
					errinfo: err
				});
			}
		});
	};

	if(!postid || !content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Both param postid and content are required.'
		});
	}

	content = sanitize(content).trim();

	if('' === content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'],
			errinfo: 'Replies can not be empty.'
		});
	}

	if(user) {
		_add();
	} else {
		if(name && email) {
			var info = {
				name: sanitize(name).trim(),
				email: sanitize(email).trim(),
				site: sanitize(site).trim()
			};

			user_ctrl.findOne(info, function(err, doc) {
				if(err) {
					user_ctrl.addOne(info, function(_err, _doc) {
						if(!_err) {
							req.session.user = user = _doc;
							_add();
						} else {
							console.log(_err);
							next(502);
						}
					});
				} else {
					req.session.user = user = doc;
					//addAComment(postid, doc, content, res);
					_add();
				}
			});
		} else {
			next(403);
		}
	}
}