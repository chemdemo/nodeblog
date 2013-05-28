
/*
 * GET home routes page.
 */

module.exports = function(app) {
	app.get('/', function(req, res) {
		res.render('index', { title: 'DM-Blog' });
	});
}