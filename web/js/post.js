'use strict';

require.config({
    //baseUrl: '../libs',
    paths: {
        jquery: '../libs/jquery/jquery',
        underscore: '../libs/underscore/underscore',
        text: '../libs/requirejs/text',
		utils: './utils'
    }
	//, urlArgs: '_t=' + Date.now()// no cache
});

define(['jquery','underscore','text!tmpl/comment.html', /*'utils',*/'./themes'], function($, _, commentTmpl, /*utils, */themes) {
	var postId = function() {
		var u = location.href;
		var m = u.match(/post\/(\w+)(?:#.*)?/);
		return m ? m[1] : null;
	}();
	var commentForm = $('#add-comment');

	function fetchComments() {
		$.get('/comment/' + postId, function(r) {
			console.log(r.result);
			var html = _.template(commentTmpl, r.result);
			$('#comment-list').html(html);
		});
	}

	var bindEvents = (function() {
		function addComment(e) {
			e.preventDefault();
			var postid = $(this).attr('data-postid');
			var name = $('#name').val();
			var email = $('#email').val();
			var site = $('#site').val();
			var content = $('#comment').val();

			var tips = function(msg) {
				$('#tips').text(msg).stop().fadeIn(500).delay(500).fadeOut(500);
			};

			if(!name) return tips('名称填一下嘛～');

			if(!email) return tips('再填下邮箱嘛～');

			if(!content) return tips('请说点啥嘛～');

			if(!postid) return;

			$.post('/comment/' + postid, {
				user: {
					name: name,
					email: email,
					site: site
				},
				content: content
			}, function(r) {
				console.log(r);
			});
		}

		return function() {
			$('#btn-add').on('click', addComment);
		}
	}());

	function init() {
		bindEvents();
		fetchComments();
	}

	$(init);
});