var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var getMonth = function() {
	var d = new Date();
	return new Date(d.getFullYear(), d.getMonth()); 
};

var PostPlaced = new Schema({
	month: {type: date, default: getMonth()},
	posts: [ObjectId]
});

mongoose.model('PostPlaced', PostPlaced);