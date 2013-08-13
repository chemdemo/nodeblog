var marked = require('marked');
var pygmentize = require('pygmentize-bundled');
var hljs = require('highlight');
var fs = require('fs');
var path = require('path');

var filePath = path.resolve(__dirname + '/../../web/markdown.md');
var outPath = path.resolve(__dirname + '/md-test.html');

fs.readFile(filePath, {encoding: 'utf8'}, function(err, data) {
	if(err) {
		return console.log('Read file error: ', err);
	}

	/*marked.setOptions({
		gfm: true,
		highlight: function (code, lang, callback) {
			pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
				if (err) return callback(err);
				callback(null, result.toString());
			});
		},
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: false,
		langPrefix: 'lang-'
	});*/
	 var markedOpts = {
		gfm: true,
		highlight: function (code, lang, callback) {
			pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
				if (err) return callback(err);
				callback(null, result.toString());
			});
			//return hljs.highlightAuto(lang, code).value;
		},
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: false,
		langPrefix: 'lang-'
	};

	marked(data, markedOpts, function(err, content) {
		if(err) {
			return console.log('Marked file error: ', err);
		}

		console.log('content: ', content);
		fs.writeFile(outPath, content, {encoding: 'utf8'}, function(err) {
			if(err) throw err;
		});
	});
});