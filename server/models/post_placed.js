var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var getMonth = function() {
	var d = new Date();
	return new Date(d.getFullYear(), d.getMonth());
};

var PostPlacedSchema = new Schema({
	month: {type: Date, default: getMonth()},
	posts: [ObjectId]
}, {collection: 'post_placed'});

mongoose.model('PostPlaced', PostPlacedSchema);