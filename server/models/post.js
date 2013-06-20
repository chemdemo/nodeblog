var settings = require('../../settings');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Post = new Schema({
	postid: ObjectId,
	title: {type: String, unique: true},
	create: {type: Date, default: Date.now, index: true},
	update: {type: Date, default: Date.now},
	author: {type: String, default: settings.ADMIN.NAME},
	content: String,
	tags: [String],
	comments: [ObjectId],
	clicked: {type: Number, default: 0},
	topped: {type: Boolean, default: false}
});

mongoose.model('Post', Post);