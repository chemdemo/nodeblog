'use strict';

define(function(require, exports, module) {
    /*var marked = require('/libs/swig/swig.min');
    var hljs = require('libs/highlight.js/highlight.pack');

    marked.setOptions({
        gfm: true,
        highlight: function (code, lang) {
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

    exports.markd = markd;

    var swig = require('/libs/swig/swig.min');
    swig.setFilter('markd', markd);
    exports.swig = swig;*/

// see http://www.css88.com/archives/5256
/*
 * 频率控制 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
 * @param fn {function}  需要调用的函数
 * @param delay  {number}    延迟时间，单位毫秒
 * @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
 * @return {function}	实际调用函数
 */
var throttle = function (fn,delay, immediate, debounce) {
    var curr = +new Date(),//当前时间
        last_call = 0,
        last_exec = 0,
        timer = null,
        diff, //时间差
        context,//上下文
        args,
        exec = function () {
            last_exec = curr;
            fn.apply(context, args);
        };
    return function () {
        curr= +new Date();
        context = this,
        args = arguments,
        diff = curr - (debounce ? last_call : last_exec) - delay;
        clearTimeout(timer);

        if (debounce) {
            if (immediate) {
                timer = setTimeout(exec, delay);
            } else if (diff >= 0) {
                exec();
            }
        } else {
            if (diff >= 0) {
                exec();
            } else if (immediate) {
                timer = setTimeout(exec, -diff);
            }
        }

        last_call = curr;
    }
};
exports.throttle = throttle;

/*
 * 空闲控制 返回函数连续调用时，空闲时间必须大于或等于 delay，fn 才会执行
 * @param fn {function}  要调用的函数
 * @param delay   {number}    空闲时间
 * @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
 * @return {function}	实际调用函数
 */
var debounce = function (fn, delay, immediate) {
	return throttle(fn, delay, immediate, true);
};
exports.debounce = debounce;

exports.searchParam = function(name) {
	var s = window.location.search;
	var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
	var m = s.substr(1).match(reg);
	return m ? unescape(m[2]) : null;
}

});