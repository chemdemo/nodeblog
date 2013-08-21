//see https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
//see http://ghosertblog.github.io/mdeditor/static/editor/scrollLink.js
define(function(require, exports, module) {
	'use strict';

	var ace = require('libs/ace/ace');
	var marked = require('libs/marked/marked');
	marked.setOptions({
		gfm: true,
		highlight: function (code, lang) {
			console.log(lang);
			if(lang) {
				return hljs.highlight(lang, code).value;
			}
			return hljs.highlightAuto(code).value;
		},
		tables: true,
		breaks: true,
		pedantic: true,
		sanitize: false,
		smartLists: true,
		smartypants: true,
		langPrefix: 'lang-'
	});
	var hljs = require('libs/highlight.js/highlight.pack');
	console.log(ace);
	window.ace =ace;

	var editor = ace.edit('post-editor');
	var session = editor.getSession();
	editor.setShowPrintMargin(false);
	editor.setHighlightActiveLine(false);
	editor.setShowPrintMargin(false);
	editor.setTheme('libs/ace/theme/crimson_editor');
	session.setMode('libs/ace/mode/markdown');

	var render = function() {
		var val = editor.getValue();
		
		marked(val, function(err, content) {
			if(err) {
				return console.log('Marked file error: ', err);
			}

			//$(window.frames['preview'].document).find('body').html(content);
			$('#preview-box').html(content);
		});
	};

	var bindEvents = (function() {
		var previewOpen = false;
		
		function onEditerChange(e) {
			if(!previewOpen) {
				return;
			}
			var timer = this.timer || null;
			clearTimeout(timer);
			this.timer = setTimeout(function() {
				console.log(e.data);
				render();
			}, 500);
		}

		function onCursorChange() {
			console.log('cursor change!');
		}

		function previewSwitch(e) {
			var previewBox = $('#post-preview');

			if(previewOpen) {// open => close
				previewBox.css({width: '0%'}).addClass('preview-close');
			} else {// close => open
				previewBox.css({width: '50%'}).removeClass('preview-close');
				render();
			}

			previewOpen = !previewOpen;
		}

		return function() {//moveCursorTo
			editor.on('change', onEditerChange);
			editor.getSession().selection.on('changeCursor', function(e) {
				console.log('cursor: ',editor.selection.getCursor())
				console.log(e)
			});
			$('.preview-ctrl').on('click', previewSwitch);
		}
	}());

	~function init() {
		$('#post-preview').css('height', document.body.clientHeight + 'px');
		bindEvents();
		$('#btn-save').click(function() {
			//editor.insert('<b>test</b>');
			var c = editor.selection.getCursor();
			console.log('getCursor: ', c)
			//editor.moveCursorTo(c.row-2, c.column+1);
			editor.gotoLine(c.row - 2);
		});

		$.get('./markdown.md', function(r) {
			editor.setValue(r);
			editor.gotoLine(0, 0, true);
		});
	}();
});