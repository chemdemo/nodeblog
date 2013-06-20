var rcodes = require('../../settings').RCODES;
var crypto = require('crypto');
var request = require('request');
var validator = require('validator');
var check = validator.check;
var sanitize = validator.sanitize;

var models = require('../models');
var User = models.User;

/*function addUser(req, res, next) {
	var name = sanitize(req.body.user_name).trim();
	var email = sanitize(req.body.user_email).trim();
}

function findUser(req, res, next) {
	;
}*/

function md5(str) {
	var hash = crypto.createHash('md5');
	hash.update(str);
	return str = hash.digest('hex');
}

function findUser(email, callback) {
	email = sanitize(email).trim();
	User.find({email: email}, callback);
}

function addUser(info, callback) {
	var name = sanitize(info.name).trim();
	var email = sanitize(info.email).trim();
	var site = sanitize(info.site || '').trim();

	if(!name || !email) {
		return callback({
			rcode: rcodes['PARAM_MISSING'],
			msg: 'Param user_name and user_email were required.'
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
		user.save(function(er) {
			console.log(er);
			callback(er);
		});
	});
}

exports.addUser = addUser;
exports.findUser = findUser;