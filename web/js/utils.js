define(function(require, exports, module) {
    'use strict';

    var jTemplate = function(str, data) {
        /*!
         * jstemplate: a light & fast js tamplate engine
         * License MIT (c) ᯰ�
         *
         * Modify by azrael @ 2012/9/28
         */
        var //global = typeof window != 'undefined' ? window : {},
            openTag = '<%',
            closeTag = '%>',
            retTag = '$return',
            vars = 'var ',
            varsInTpl,
            codeArr = ''.trim ?
                [retTag + ' = "";', retTag + ' +=', ';', retTag + ';', 'print=function(){' + retTag + '+=[].join.call(arguments,"")},'] :
                [retTag + ' = [];', retTag + '.push(', ')', retTag + '.join("");', 'print=function(){' + retTag + '.push.apply(arguments)},'],
            keys = ('break,case,catch,continue,debugger,default,delete,do,else,false,finally,for,function,if'
                + ',in,instanceof,new,null,return,switch,this,throw,true,try,typeof,var,void,while,with'
                // Reserved words
                + ',abstract,boolean,byte,char,class,const,double,enum,export,extends,final,float,goto'
                + ',implements,import,int,interface,long,native,package,private,protected,public,short'
                + ',static,super,synchronized,throws,transient,volatile'

                // ECMA 5 - use strict
                + ',arguments,let,yield').split(','),
            keyMap = {};

        for (var i = 0, len = keys.length; i < len; i ++) {
            keyMap[keys[i]] = 1;
        }

        function _getCompileFn (source) {
            vars = 'var ';
            varsInTpl = {};
            varsInTpl[retTag] = 1;
            var openArr = source.split(openTag),
                tmpCode = '';

            for (var i = 0, len = openArr.length; i < len; i ++) {
                var c = openArr[i],
                    cArr = c.split(closeTag);
                if (cArr.length == 1) {
                    tmpCode += _html(cArr[0]);
                } else {
                    tmpCode += _js(cArr[0]);
                    tmpCode += cArr[1] ? _html(cArr[1]) : '';
                }
            }

            var code = vars + codeArr[0] + tmpCode + 'return ' + codeArr[3];
            var fn = new Function('$data', code);

            return fn;
        }

        function _html (s) {
            s = s
                .replace(/('|"|\\)/g, '\\$1')
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n');

            s = codeArr[1] + '"' + s + '"' + codeArr[2];

            return s + '\n';
        }

        function _js (s) {
            if (/^=/.test(s)) {
                s = codeArr[1] + s.substring(1).replace(/[\s;]*$/, '') + codeArr[2];
            }
            dealWithVars(s);

            return s + '\n';
        }

        function dealWithVars (s) {
            s = s.replace(/\/\*.*?\*\/|'[^']*'|"[^"]*"|\.[\$\w]+/g, '');
            var sarr = s.split(/[^\$\w\d]+/);
            for (var i = 0, len = sarr.length; i < len; i ++) {
                var c = sarr[i];
                if (!c || keyMap[c] || /^\d/.test(c)) {
                    continue;
                }
                if (!varsInTpl[c]) {
                    if (c === 'print') {
                        vars += codeArr[4];
                    } else {
                        vars += (c + '=$data.hasOwnProperty("'+c+'")?$data.' + c + ':window.' + c + ',');
                    }
                    varsInTpl[c] = 1;
                }
            }
        }


        var cache = {};
        return function(str, data){
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] || (cache[str] = _getCompileFn(document.getElementById(str).innerHTML)) :
                _getCompileFn(str);

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        };
    }();
    exports.tmpl = jTemplate;

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

    var searchParam = function(name) {
    	var s = window.location.search;
    	var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    	var m = s.substr(1).match(reg);
    	return m ? unescape(m[2]) : null;
    };
    exports.searchParam;
});