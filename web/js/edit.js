//see https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
//see http://ghosertblog.github.io/mdeditor/static/editor/scrollLink.js
'use strict';

require.config({
	//urlArgs: '_t=' + (new Date()).getTime(), //for development
	baseUrl: '/js',
	paths: {
		'jquery': '../lib/jquery/jquery',
		'ace': '../lib/ace',
        'marked': '../lib/marked/marked',
        'hljs': '../lib/highlight.js/highlight.pack',
        'underscore': '../lib/underscore/underscore',
		'utils': 'utils',
		'themes': 'themes'
	},
	//waitSeconds: 15,
	shim: {
		'underscore': {
			'exports': '_'
		}
	}
});

require(['jquery','ace/ace', 'marked', 'hljs', 'utils'], function($, ace, marked, hljs, utils) {
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
	editor.setAutoScrollEditorIntoView();
	editor.setTheme('ace/theme/crimson_editor');
	session.setMode('ace/mode/markdown');
	session.setUseWrapMode(true);

	//var bar = new ScrollBar($('#post-editor')[0]);

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
		r.tags = $('#post-tags').val().split(/[\s;]/);
		r.topped = $('#set-topped').prop('checked') - 0;
		return r;
	};

	var bindEvents = (function() {
		var previewWrapper = $('#post-preview');
		var previewBox = $('#preview-box');
		var previewOpen = false;
		var tagsBoxShow = false;

		function stopPropagation(e) {
			e.preventDefault();
			e.stopPropagation();
		}

		function showTagsBox(e) {
			stopPropagation(e);
			if(!tagsBoxShow) {
				$('.tags-select').fadeIn('slow');
				tagsBoxShow = true;
			}
		}

		function selectTag(e) {
			var self = $(this);
			var tag = self.text();
			var postTags = $('#post-tags');
			var curTags = postTags.val().split(/[\s+;]/);

			if(curTags.indexOf(tag) === -1) {
				postTags.val(postTags.val() + ' ' + tag);
			}
		}

		function hideTagsBox(e) {
			if(tagsBoxShow) {
				$('.tags-select').fadeOut('slow');
				tagsBoxShow = false;
			}
		}

		function editorHandler(e) {
			var self = $(this);
			var cmd = self.attr('data-cmd');

			if(!cmd) return;

			if(cmd !== 'export-md') {
				var v = self.attr('data-insert');
				var i = v.indexOf('^');

				if(i !== -1) {
					var p = editor.getCursorPosition();
					editor.insert(v.replace(/\^/, ''));
					editor.moveCursorTo(p.row, p.column + i);
				} else {
					editor.insert(v);
				}
				editor.focus();
			} else {
				if(window.Blob) {
					var blob = new Blob([editor.getValue()], {
                        type: 'text/plain',
                        charset: document.characterSet
                    });
                    utils.saveAs(blob, ($('#post-title').val() || 'Untitled') + '.md');
				} else {
					alert('Your browser is too old to support this action.');
				}
			}
		}

		function importHandler(e) {
			var files = e.target.files || e.dataTransfer.files;
			var reader = new FileReader();

			reader.onload = function(e) {
				try {
					editor.setValue(e.target.result);
				} catch(ex) {
					throw new Error(ex);
					alert('Error occurs while reading the file.');
				}
			}

			reader.readAsText(files[0]);
		}
		
		function onEditerChange(e) {
			if(!previewOpen) return;

			~utils.debounce(render, 500, true)();
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

		function save(e) {
			var pid = $('#postid').val();
			var url = '/edit/' + pid;
			var data = getData();
			//return console.log(data.content)

			if(!data.title || !data.content) return alert('字段不完整！');

			$.post(url, {
				data: JSON.stringify(data),
				postid: pid,
				_csrf: $('#csrf').val()
			}, function(r) {
				if(r.rcode === 0) {
					return window.location = '/post/' + r.result;
				}
				console.log(r);
			});
		}

		function syncScroll(e) {
			//console.log('cursor: ', editor.selection.getCursor())
			if(!previewOpen) return;

			~utils.debounce(function() {
				var H = previewBox[0].scrollHeight;
				var n = editor.getFirstVisibleRow();
				var l = editor.getSession().getLength();
				//console.log('scrollTop: ', H*(n/l));
				previewBox.scrollTop(H*(n/l));
			}, 500, true)();
		}

		return function() {//moveCursorTo
			$('.preview-ctrl').on('click', previewSwitch);
			$('.add-tags').on('click', showTagsBox);
			$('.tags-select').on('click', stopPropagation);
			$('.tags-list .tag').on('click', selectTag);
			$('.tags-select .close').on('click', hideTagsBox);
			$(document).on('click', hideTagsBox);

			editor.on('change', onEditerChange);
			$('.editor-btn').on('click', editorHandler);
			$('#import-md').on('change', importHandler);
			$('#btn-save').on('click', save);
			editor.session.on('changeScrollTop', syncScroll);
			editor.session.selection.on('changeCursor', syncScroll);
		}
	}());

	function init() {
		bindEvents();
		//editor.setValue($('#post-content').val());
		var pid = $('#postid').val();
		if(pid) {
			$.get('/edit/' + pid, function(r) {
				console.log(r);
				if(r.rcode === 0) {
					r = r.result;
					editor.setValue(r.content);
					$('#post-summary').val(r.summary);
				} else {
					alert('Fetch data error.', r);
				}
			});
		}
	}

	$(init);
});