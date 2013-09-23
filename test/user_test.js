var user_ctrl = require('../server/controller/user');
var settings = require('../settings');

var testInfo = {
	name: 'test',
	email: '212erreg@gmail.com',
	pass: 'pass4site'
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

//find();
//add();

function addAdmin() {
	var admin = settings.ADMIN;
	var info = {
		email: admin.EMAIL,
		pass: admin.PASS,
		name: '',
		site: admin.SITE
	};

	user_ctrl.addOne(info, function(err, doc) {
		console.log(err, doc);
		user_ctrl.findOne(info, function(err, doc) {console.log(err, doc);});
	});
}
//addAdmin();
