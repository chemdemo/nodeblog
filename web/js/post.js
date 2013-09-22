'use strict';

require(['jquery','underscore','utils','themes'], function($, _, utils, themes) {
	var user = function() {
		var loginBox = $('#user-login');
		if(loginBox.length) {
			return {
				name: loginBox.find('.name').val()
				, email: loginBox.find('.email').val()
				, site: loginBox.find('.site').val()
			}
		}
		return null;
	}();

	var postId = $('#postid').val() || function() {
		var u = location.href;
		var m = u.match(/post\/(\w+)(?:#.*)?/);
		return m ? m[1] : null;
	}();

	var csrf = $('#csrf').val();

	var lazyLoadAvatar = function() {
		var userAvatar = $('#user-login .avatar');
		if(userAvatar[0]) {
			userAvatar.attr('src', userAvatar.attr('data-src'));
		}
	};

	function fetchComments() {
		$.get('/comment/' + postId, function(r) {
			console.log(r)
			if(r.rcode === 0) {
				if(r.result.comments.length) {
					require(['text!tmpl/comment.html'], function(tmpl) {
						$('#comment-list').html(_.template(tmpl, r.result));
					});
				}
			} else {
				console.log('Fetch comments error!', r);
			}

			lazyLoadAvatar();
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

			if(!postId) return alert('postid was not found.');

			var tips = function(msg) {
				$('#tips').text(msg).stop().fadeIn(500).delay(500).fadeOut(500);
			};
			var content = $('#comment').val();
			if(!user) {
				var name = $('#name').val();
				var email = $('#email').val();
				var site = $('#site').val();

				if(!name) return tips('名称填一下嘛～');
				if(!email) return tips('再填下邮箱嘛～');
				if(!utils.isEmail(email)) return tips('邮箱格式不对吧？');
				if(site && !utils.isUrl(site)) return tips('网址格式不对哦～');
			}

			if(!content) return tips('随便说点啥嘛～');

			$.post('/comment/add/' + postId, {
				user: user || {name: name, email: email, site: site},
				_csrf: csrf,
				reply_comment_id: $('#reply-comment-id').val(),
				at_user_id: $('#at-user-id').val(),
				content: content
			}, function(r) {
				//console.log(r)
				if(r.rcode === 0) {
					require(['text!tmpl/reply.html'], function(tmpl) {
						$('#comment-list .no-comment').remove();
						appendWrapper.append(_.template(tmpl, r.result));
						$('#btn-cancel').trigger('click');
					});
					if(!user) {
						user = r.result.author;
						require(['text!tmpl/user-login.html'], function(tmpl) {
							$('#user-logout').replaceWith(_.template(tmpl, user));
							lazyLoadAvatar();
						});
					}
				} else if(r.rcode === 10000) {
					location.href = '/login';
				} else {
					//tips('添加评论失败，再试一次？');
					alert('添加评论失败');
					console.log('Add comment error, ', r);
				}
			});
		}

		function delComment(cid) {
			$.ajax({
				url: '/comment/delete/' + cid, 
				method: 'delete',
				data: {postid: postId, _csrf: csrf},
				success: function(r) {
					console.log(r);
					if(r.rcode === 0) {
						fetchComments();// 重新拉一遍，省事儿。。
					} else {
						console.log('Remove comment error: ', r.errinfo);
						alert('删除评论失败。');
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

		function logout(e) {
			$.get('/logout'/*, {_csrf: csrf}*/, function(r) {
				//console.log(r);
				// 这里因为没有刷新csrf，提交会导致403
				location.reload();
				/*require(['text!tmpl/user-logout.html'], function(tmpl) {
					$('#user-login').replaceWith(tmpl);
					user = null;
					$('.login-out').on('click', logout);
				});*/
			});
		}

		function onCommentsClick(e) {
			e.preventDefault();
			e.stopPropagation();

			var self = $(e.target);
			var cmd = self.attr('data-cmd');
			var p = self.parent().parent().parent().parent();
			var cid = p.attr('data-cid');

			if(!cid) return;

			switch(cmd) {
				case 'reply':
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
					delComment(cid);
					break;
				default: break;
			}
		}

		function onAddBoxClick(e) {
			var self = $(e.target);
			var cmd = self.attr('data-cmd');

			switch(cmd) {
				case 'add': 
					addComment(e);
					break;
				case 'cancel':
					cancelComment(e);
					break;
				case 'logout':
					logout(e);
					break;
			}
		}

		return function() {
			//$('#btn-add').on('click', addComment);
			//$('#btn-cancel').on('click', cancelComment);
			$('#comment-list').on('click', onCommentsClick);
			$('#add-comment').on('click', onAddBoxClick);
			//$('.login-out').on('click', logout);
		}
	}());

	function init() {
		//$('#post-body').html($('#post-content').val());
		if(postId) {
			$.get('/post/content/' + postId, {type: 'html'}, function(r) {
				if(r.rcode === 0) {//console.log(r.result)
					$('#post-body').html(r.result);
					bindEvents();
					fetchComments();
					//themes.init();
				} else {
					console.log(r);
					alert('拉取数据失败。');
				}

				$('#page-body').removeClass('none');
			});
		}

		// init duoshuo module
		/*(function() {
			window.duoshuoQuery = {
				short_name: 'dmfeel',
				sso: { 
			       //login: 'http://duoshuo.com/login/',
			       login: location.href,
			       //logout: 'http://duoshuo.com/logout/'
			       logout: location.href
	   			}
			};

			var ds = document.createElement('script');
			ds.type = 'text/javascript';ds.async = true;
			ds.src = 'http://static.duoshuo.com/embed.js';
			ds.charset = 'UTF-8';
			(document.getElementsByTagName('head')[0] 
			|| document.getElementsByTagName('body')[0]).appendChild(ds);
		})();*/

		/*var t = new Date().getTime(),
        	script = document.getElementById('bd_soc_login_boot'),
        	redirect_uri = encodeURIComponent('http://www.dmfeel.com/social/oauth/callback'),
        	domid = 'social-login-bd',
        	src = "http://openapi.baidu.com/social/oauth/2.0/connect/login?redirect_uri=" + redirect_uri + "&domid=" + domid + "&client_type=web&response_type=code&media_types=sinaweibo%2Cqqdenglu%2Cbaidu%2Cqqweibo%2Crenren&size=-1&button_type=3&client_id=IXRaAxjZhBCXURI67ju2ZwM2&view=embedded&t=" + t;
    	script.src = src;*/
	}

	$(init);
});