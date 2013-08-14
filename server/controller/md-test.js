var marked = require('marked');
var pygmentize = require('pygmentize-bundled');
var hljs = require('highlight.js');
var fs = require('fs');
var path = require('path');

var filePath = path.resolve(__dirname + '/../../web/markdown.md');
var outPath = path.resolve(__dirname + '/md-test.html');
var htmlH = '<!doctype html>\
	<html>\
	<head>\
	    <meta charset="utf-8">\
	    <title>demo</title>\
	    <link href="styles/solarized_dark.css" rel="stylesheet" />\
	    <style type="text/css">body {font: 12px/1.6 \'Microsoft Yahei\', Tahoma;}pre, code {font-family: Monaco, Consolas, "Lucida Console", monospace;}</style>\
	</head>\
	<body>';
var htmlB = '</head><body>';

hljs.tabReplace = '    ';
hljs.tabReplace = '<span class="indent">\t</span>';

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
		highlight: function (code, lang) {
			/*pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
				if (err) return callback(err);
				callback(null, result.toString());
			});*/
			console.log(lang);
			if(lang) {
				return hljs.highlight(lang, code).value;
			}
			return hljs.highlightAuto(code).value;
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

		//console.log('content: ', content);
		try {
			fs.writeFileSync(outPath, htmlH + content + htmlB, {encoding: 'utf8'});
		} catch(e) {
			throw e;
		}
	});
});