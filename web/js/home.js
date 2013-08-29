'use strict';

define(function(require, exports, module) {
	var marked = require('libs/marked/marked');
	var hljs = require('libs/highlight.js/highlight.pack');

	marked.setOptions({
		highlight: function (code, lang) {
			if(lang) {
				return hljs.highlight(lang, code).value;
			}
			return hljs.highlightAuto(code).value;
		},
		breaks: true,
		pedantic: true,
		sanitize: false,
		smartypants: true
	});

	/*marked($('.post-summary').text(), function(err, content) {
		if(!err) $('.post-summary').html(content);
	});*/

	console.log($('.post-summary').length)
});