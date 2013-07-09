var settings = require('../../settings');
var rcodes = settings.RCODES;
var crypto = require('crypto');
var request = require('request');

var models = require('../models');
var User = models.User;

function md5(str) {
	var hash = crypto.createHash('md5');
	hash.update(str);
	return str = hash.digest('hex');
}

function findOne(query, callback) {
	User.findOne(query, callback);
}

function findById(id, callback) {
	//findOne({_id: id}, callback);
	User.findById(id, callback);
}

function addOne(info, callback) {
	var name = info.name;
	var email = info.email;
	var site = info.site || '';

	if(!name || !email) {
		return callback({
			rcode: rcodes['PARAM_MISSING'],
			msg: 'Both user_name and user_email are required.'
		});
	}

	var avatar_url = 'http://www.gravatar.com/avatar/' + md5(email) + '?size=48';
	var user = new User();
	user.name = name;
	user.email = email;
	user.site = site;

	request(avatar_url, function(err) {
		user.avatar = !err ? avatar_url : settings.DEFAULT_AVATAR;
		console.log(user);
		user.save(function(er, doc) {
			console.log(er, doc);
			callback(er, doc);
		});
	});
}

exports.addOne = addOne;
exports.findOne = findOne;
exports.findById = findById;