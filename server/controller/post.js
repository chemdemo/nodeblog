var settings = require('../../settings');
var rcodes = settings.RCODES;
var models = require('../models');
var Post = models.Post;
var user_ctrl = require('./user');

function addPost(req, res, next) {
	var uid = req.session.uid;
	var title = req.body.title;
	var content = req.body.body;
	var tags = req.body.tags || [];
	var top = req.body.top || false;

	if(!title || !content) {
		return res.json({
			rcode: rcodes['PARAM_MISSING'], 
			errinfo: 'Both title and content are required.'
		});
	}
}