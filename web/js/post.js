'use strict';

require.config({
    //baseUrl: '../libs',
    paths: {
        jquery: '../lib/jquery/jquery',
        underscore: '../lib/underscore/underscore',
        text: '../lib/requirejs/text',
		utils: './utils'
    }
	//, urlArgs: '_t=' + Date.now()// no cache
});

define(
	['jquery',
	'underscore',
	'text!tmpl/comment.html', 
	'text!tmpl/reply.html',
	/*'utils',*/
	'./themes'], 
	function($, _, commentTmpl, replyTmpl, /*utils, */themes) {
	
	var postId = function() {
		var u = location.href;
		var m = u.match(/post\/(\w+)(?:#.*)?/);
		return m ? m[1] : null;
	}();

	function fetchComments() {
		$.get('/comment/' + postId, function(r) {
			console.log(r)
			if(r.rcode === 0) {
				if(r.result.comments.length) $('#comment-list').html(_.template(commentTmpl, r.result));
			} else {
				console.log('Fetch comments error!', r);
			}
		});
	}

	var bindEvents = (function() {
		var commentForm = $('#add-comment');
		var repling;
		var appendWrapper = $('#comment-list');

		// 这里，最好写个状态机

		function addComment(e) {//return console.log(appendWrapper)
			e.preventDefault();
			e.stopPropagation();

			var postid = $(this).attr('data-postid');
			var name = $('#name').val();
			var email = $('#email').val();
			var site = $('#site').val();
			var csrf = $('#csrf').val();
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
				_csrf: csrf,
				reply_comment_id: $('#reply-comment-id').val(),
				at_user_id: $('#at-user-id').val(),
				content: content
			}, function(r) {
				console.log(r)
				if(r.rcode === 0) {
					$('#comment-list .no-comment').remove();
					appendWrapper.append(_.template(replyTmpl, r.result).replace(/\n/g, ''));
					$('#btn-cancel').trigger('click');
				} else if(r.rcode === 10000) {
					location.href = '/login';
				} else {
					tips('添加评论失败，再试一次？');
					console.log('Add comment error, ', r);
				}
			});
		}

		function delComment(cid) {
			$.ajax({
				url: '/comment/' + cid, 
				method: 'delete',
				data: {postid: postId},
				success: function(r) {
					console.log(r);
					if(r.rcode === 0) {
						fetchComments();// 重新拉一遍，省事儿。。
					} else {
						console.log('Remove comment error: ', r.errinfo);
						alert('删除评论失败，重新试试？');
					}
				}
			});
		}

		function cancelComment(e) {
			e.preventDefault();
			e.stopPropagation();

			$('#reply-comment-id').val('');
			$('#at-user-id').val('');
			$('#comment').val('');

			if(repling) {
				commentForm.appendTo($('#post-comments'));
			}

			repling = false;
			appendWrapper = $('#comment-list');
		}

		function onCommentsClick(e) {
			e.preventDefault();
			e.stopPropagation();

			var self = $(e.target);
			var cmd = self.attr('data-cmd');
			var p = self.parent().parent().parent();

			switch(cmd) {
				case 'reply':
					var cid = p.attr('data-cid');
					$('#reply-comment-id').val(cid);
					appendWrapper = p.find('.reply-list');
					repling = true;
					commentForm.insertBefore(p.find('.reply-list'));
					break;
				case 're-reply':
					var rid = p.attr('data-rid');
					var uid = p.attr('data-uid');
					$('#reply-comment-id').val(rid);
					$('#at-user-id').val(uid);
					appendWrapper = p.parent();
					repling = true;
					commentForm.appendTo(p.find('.comment-body'));
					break;
				case 'delete':
					delComment(p.attr('data-cid'));
					break;
				default: break;
			}
		}

		return function() {
			$('#btn-add').on('click', addComment);
			$('#btn-cancel').on('click', cancelComment);
			$('#comment-list').on('click', onCommentsClick);
		}
	}());

	function init() {
		//$('#post-body').html($('#post-content').val());
		var pid = $('#postid').val();
		if(pid) {
			$.get('/post/' + pid, function(r) {
				if(r.rcode === 0) {console.log(r.result)
					$('#post-body').html(r.result);
					bindEvents();
					fetchComments();
					//themes.init();
				} else {
					console.log(r);
					alert('拉取数据失败。');
				}
			});
		}
	}

	$(init);
});