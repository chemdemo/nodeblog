var settings = require('../../settings');
var rcodes = settings.RCODES;

var crypto = require('crypto');
var request = require('request');
var check = require('validator').check;
var sanitize = require('validator').sanitize;

var models = require('../models');
var User = models.User;

function md5(str) {
	var hash = crypto.createHash('md5');
	hash.update(str);
	return str = hash.digest('hex');
}

function infoCheck(info) {
	info.name = sanitize(info.name).trim();
	info.name = sanitize(info.name).xss();
	info.email = sanitize(info.email).trim().toLowerCase();
	info.email = sanitize(info.email).xss();
	info.site = sanitize(info.site).trim();
	info.site = sanitize(info.site).xss();

	if(!name || !email) {
		info.error = 'Param name and email is required.';
		return info;
	}

	try {
		check(info.email, 'Illegal email.').isEmail();
	} catch(e) {
		info.error = 'Illegal email.';
	}

	return info;
}

function adminCheck(user) {
	var admin = settings.ADMIN;
	return user && user.name === admin.NAME && user.email === admin.EMAIL && user.pass === admin.PASS;
}

function findOne(query, callback) {
	if(query.pass) {
		query.pass = md5(query.pass);
	}

	User.findOne(query, callback);
}

function findById(id, callback) {
	User.findById(id, callback);
}

function addOne(info, callback) {
	info = infoCheck(info);
	if(info.error) return callback(info.error);

	var avatar_url = 'http://www.gravatar.com/avatar/' + md5(info.email) + '?size=48';

	request(avatar_url, function(err, res) {
		var user = new User();
		user.name = info.name;
		user.pass = info.pass;
		user.email = info.email;
		user.site = info.site;
		user.avatar = !err && res.statusCode === 200 ? avatar_url : settings.DEFAULT_AVATAR;
		console.log(user);
		user.save(callback);
	});
}

exports.infoCheck = infoCheck;
exports.findById = findById;
exports.addOne = addOne;
exports.findOne = findOne;