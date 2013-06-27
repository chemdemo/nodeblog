var settings = require('../../settings');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Post = new Schema({
	title: {type: String, unique: true},
	create: {type: Date, default: Date.now, index: true},
	update: {type: Date, default: Date.now},
	author: {type: String, default: settings.ADMIN.NAME},
	content: String,
	tags: [String],
	comments: Number,
	visite: {type: Number, default: 0},
	top: {type: Boolean, default: false},
	last_comment_at: {type: Date, default: Date.now},
	last_comment_by: ObjectId
});

mongoose.model('Post', Post);