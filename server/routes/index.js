
/*
 * GET home routes page.
 */

module.exports = function(app) {
	app.get('/', function(req, res) {
		res.render('index.html');
	});
	app.get('/edit', function(req, res) {
		res.render('edit.html');
	});
}