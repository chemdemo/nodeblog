define(function(require, exports, module) {
	'use strict';

	var ace = require('libs/ace/ace');
	var marked = require('libs/marked/marked');
	var hljs = require('libs/highlight.js/highlight.pack');

	var editor = ace.edit('post-editor');
	editor.setShowPrintMargin(false);
	editor.setTheme('libs/ace/theme/crimson_editor');
	editor.getSession().setMode('libs/ace/mode/markdown');

	function rendMd() {
		var val = editor.getValue();
		var markedOpts = {
			gfm: true,
			highlight: function (code, lang) {
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

		marked(val, markedOpts, function(err, content) {
			if(err) {
				return console.log('Marked file error: ', err);
			}

			//console.log('content: ', content);
			$(window.frames['preview'].document).find('body').html(content);
		});
	}

	$.get('./markdown.md', function(r) {
		editor.setValue(r);
		rendMd();
	});
});