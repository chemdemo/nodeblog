//see https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
//see http://ghosertblog.github.io/mdeditor/static/editor/scrollLink.js
'use strict';

require([
    'jquery',
    'ace',
    'marked',
    'hljs',
    'underscore',
    'utils'
], function($, ace, marked, hljs, _, utils) {
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
    // editor.setHighlightActiveLine(false);
    editor.setShowPrintMargin(false);
    editor.setAutoScrollEditorIntoView();
    session.setMode('ace/mode/markdown');
    editor.setTheme('ace/theme/crimson_editor');
    session.setUseWrapMode(true);

    var postId = $('#postid').val() || function() {
        var u = location.href;
        var m = u.match(/edit\/(\w+)(?:#.*)?/);
        return m ? m[1] : null;
    }();

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
        var previewWrapper = $('#post-preview');
        var previewBox = $('#preview-box');
        var previewOpen = false;
        var tagsBoxShow = false;
        var update = {};//window.update = update

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

        function createPost(e) {
            var data = function() {
                var r = {};
                r.title = $('#post-title').val();
                r.content = editor.getValue();
                //r.cover = '';
                r.summary = $('#post-summary').val();
                r.tags = $('#post-tags').val().split(/[\s;]/);
                r.topped = $('#set-topped').prop('checked') - 0;
                return r;
            }();

            if(!data.title || !data.content) return alert('字段不完整！');

            $.ajax({
                url: '/post/create',
                method: 'POST',
                data: {
                    data: JSON.stringify(data),
                    //postid: postId,
                    _csrf: $('#csrf').val()
                },
                success: function(r) {
                    if(r.rcode === 0) {
                        return window.location = '/post/' + r.result;
                    } else {
                        console.log(r);
                    }
                }
            });
        }

        function updatePost(e) {
            if(!_.isEmpty(update)) {
                $.ajax({
                    url: '/post/update/' + postId,
                    method: 'PUT',
                    data: {update: JSON.stringify(update), _csrf: $('#csrf').val()},
                    success: function(r) {
                        if(r.rcode === 0) {
                            update = {};
                            alert('更新成功！');
                        } else {
                            console.log(r);
                            alert('更新失败！');
                        }
                    }
                });
            }
        }

        function syncScroll(e) {
            //console.log('cursor: ', editor.selection.getCursor())
            if(!previewOpen) return;

            ~_.debounce(function() {
                var H = previewBox[0].scrollHeight;
                var n = editor.getFirstVisibleRow();
                var l = editor.getSession().getLength();
                //console.log('scrollTop: ', H*(n/l));
                previewBox.scrollTop(H*(n/l));
            }, 500)();
        }

        // 这里使用MVC模式更好，考虑下angular..
        function updateBind() {
            var _set = function(key) {
                if('tags' === key) return update[key] = this.val().split(/[\s;]/);
                if('topped' === key) return update[key] = this.prop('checked') - 0;
                update[key] = this.val();
            };

            $('#post-title').on('change', _set.bind($('#post-title'), 'title'));
            $('#post-summary').on('change', _set.bind($('#post-summary'), 'summary'));
            $('#post-tags').on('change', _set.bind($('#post-tags'), 'tags'));
            $('#set-topped').on('change', _set.bind($('#set-topped'), 'topped'));
        }

        function onEditerChange(e) {
            ~_.debounce(function() {
                update['content'] = editor.getValue();
                if(previewOpen) render();
            }, 500)();
        }

        return function() {//moveCursorTo
            $('.preview-ctrl').on('click', previewSwitch);
            $('#btn-create').on('click', createPost);
            $('#btn-update').on('click', updatePost);
            $('.add-tags').on('click', showTagsBox);
            $('.tags-select').on('click', stopPropagation);
            $('.tags-list .tag').on('click', selectTag);
            $('.tags-select .close').on('click', hideTagsBox);
            $(document).on('click', hideTagsBox);

            editor.on('change', onEditerChange);
            $('.editor-btn').on('click', editorHandler);
            $('#import-md').on('change', importHandler);
            editor.session.on('changeScrollTop', syncScroll);
            editor.session.selection.on('changeCursor', syncScroll);

            updateBind();
        }
    }());

    function init() {
        if(postId) {
            $.get('/post/content/' + postId + '?summary=true', function(r) {
                console.log(r);
                if(r.rcode === 0) {
                    r = r.result;
                    editor.setValue(r.content);
                    $('#post-summary').val(r.summary);
                    bindEvents();
                } else {
                    alert('Fetch data error.', r);
                }
            });
        } else {
            bindEvents();
        }
    }

    $(init);
});
