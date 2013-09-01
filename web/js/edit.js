//see https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
//see http://ghosertblog.github.io/mdeditor/static/editor/scrollLink.js

'use strict';

define(function(require, exports, module) {
	var utils = require('utils');
	var ace = require('libs/ace/ace');
	var marked = require('libs/marked/marked');
	var ace = require('libs/ace/ace');
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

	var getData = function() {
		var r = {};
		r.title = $('#post-title').val();
		r.content = editor.getValue();
		//r.cover = '';
		r.summary = $('#post-summary').val();
		r.tags = $('#post-tags').val().split(/[^\w+]/);
		r.topped = $('#set-topped').prop('checked') - 0;
		return r;
	};

	var bindEvents = (function() {
		var previewWrapper = $('#post-preview');
		var previewBox = $('#preview-box');
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
			if(previewOpen) {// open => close
				previewWrapper.css({width: '0%'}).addClass('preview-close');
			} else {// close => open
				previewWrapper.css({width: '50%'}).removeClass('preview-close');
				render();
			}

			previewOpen = !previewOpen;
		}

		function savePost(e) {
			var pid = $(this).attr('data-pid');
			var url = '/edit' + (pid ? '/' + pid : '');
			return $.post(url, {data: JSON.stringify(getData())}, function(r) {
				if(r.rcode === 0) {
					return window.location = '/post/' + r.result;
				}
				console.log(r);
			});
		}

		function syncScroll(e) {
			console.log('cursor: ',editor.selection.getCursor())

			if(!previewOpen) return;

			~util.debounce(function() {
				var H = previewBox[0].scrollHeight;
				var n = editor.getFirstVisibleRow();
				var l = editor.getSession().getLength();
				console.log('scrollTop: ', H*(n/l));
				previewBox.scrollTop(H*(n/l));
			}, 500, true)();
		}

		return function() {//moveCursorTo
			editor.on('change', onEditerChange);
			$('.preview-ctrl').on('click', previewSwitch);
			$('#btn-save').on('click', savePost);
			
			//editor.session.on('changeScrollTop', syncScroll);
			editor.session.selection.on('changeCursor', syncScroll);
		}
	}());

	~function init() {
		bindEvents();

		/*$.get('./markdown.md', function(r) {
			editor.setValue(r);
			editor.gotoLine(0, 0, true);
		});*/
	}();
});