var user_ctrl = require('../server/controller/user');

var testInfo = {
	name: 'test',
	email: '212erreg@gmail.com',
	pass: 'pass@123'
};

function find() {
	user_ctrl.findOne(testInfo, function(err, doc) {
		console.log('find: ');
		console.log(err, doc);
	});
}

function add() {
	user_ctrl.addOne(testInfo, function(err, doc) {
		console.log('add: ');
		console.log(err, doc);

		find();
	});
}

find();
//add();