var settings = require('../../settings');
var admin = settings.ADMIN;

var crypto = require('crypto');
//var request = require('request');
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
	info.name = sanitize(info.name || '').trim();
	info.name = sanitize(info.name).xss();
	info.email = sanitize(info.email).trim().toLowerCase();
	info.email = sanitize(info.email).xss();
	info.pass = sanitize(info.pass).trim();
	info.pass = sanitize(info.pass).xss();
	if(info.site) {
		info.site = sanitize(info.site).trim();
		info.site = sanitize(info.site).xss();
	}

	if(!info.name || !info.email || !info.pass) {
		info.error = '信息填写不完整。';
		return info;
	}

	/*try {
		check(info.name, '用户名只能使用0-9，a-z，A-Z。').isAlphanumeric();
	} catch(e) {
		info.error = e.message;
		return info;
	}*/

	try {
		check(info.email, 'Illegal email.').isEmail();
	} catch(e) {
		info.error = e.message;
		return info;
	}

	if(info.site) {
		try {
			check(info.site, 'Illegal site url.').isUrl();
		} catch(e) {
			info.error = e.message;
			return info;
		}
	}

	if(!info.pass) {
		info.error = '密码不能为空。';
		return info;
	}

	return info;
}

function adminCheck(user) {
	return user && 
		admin.NAMES.indexOf(user.name) > -1 &&
		user.email === admin.EMAIL &&
		user.pass === md5(admin.PASS);
}

function findOne(query, callback) {
	if(query.pass) {
		query.pass = md5(query.pass);
	}
	User.findOne(query, callback);
}

function findByIdAndUpdate(userid, update, callback) {
	User.findByIdAndUpdate(userid, update, callback);
}

function findById(id, fields, callback) {
	User.findById(id, fields, callback);
}

function genAvatar(email) {
	return 'http://www.gravatar.com/avatar/' + md5(email) + '?size=48';
}

function addOne(info, callback) {
	var user = new User();
	user.name = info.name;
	user.pass = md5(info.pass);
	user.email = info.email;
	user.site = info.site;
	user.avatar = info.avatar || genAvatar(user.email);
	console.log(user)
	//user.admin = (info.email === admin.EMAIL && user.pass === md5(admin.PASS));
	user.admin = adminCheck(user);
	user.save(callback);
}

function setCookie(res, user) {
	res.cookie('_id', user._id);
	res.cookie('name', user.name);
	res.cookie('email', user.email);
	res.cookie('site', user.site);
	res.cookie('avatar', user.avatar);
}

exports.md5 = md5;
exports.genAvatar = genAvatar;
exports.setCookie = setCookie;
exports.infoCheck = infoCheck;
exports.findById = findById;
exports.findByIdAndUpdate = findByIdAndUpdate;
exports.addOne = addOne;
exports.findOne = findOne;
// exports.adminCheck = adminCheck;