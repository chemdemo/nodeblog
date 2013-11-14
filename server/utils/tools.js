var settings = require('../../settings');
var rcodes = settings.RCODES;
var crypto = require('crypto');

/**
 * 让日期和时间按照指定的格式显示的方法
 * @method date
 * @memberOf format
 * @param {String} format 格式字符串
 * @return {String} 返回生成的日期时间字符串
 *
 * see: Jx().format.date
 */
function dateFormat(date, formatString) {
    /*
     * eg:formatString="YYYY-MM-DD hh:mm:ss";
     */
    var o = {
        "M+" : date.getMonth()+1,    //month
        "D+" : date.getDate(),    //day
        "h+" : date.getHours(),    //hour
        "m+" : date.getMinutes(),    //minute
        "s+" : date.getSeconds(),    //second
        "q+" : Math.floor((date.getMonth()+3)/3),    //quarter
        "S" : date.getMilliseconds()    //millisecond
    }

    if(/(Y+)/.test(formatString)){
        formatString = formatString.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o){
        if(new RegExp("("+ k +")").test(formatString)){
            formatString = formatString.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        }
    }
    return formatString;
};

function jsonReturn(res, rtype, r, err) {
    res.json({
        rcode: rcodes[rtype],
        result: r,
        errinfo: err || 'No error.'
    });
};

function prezero(n) {
    return ('0' + n).slice(-2);
};

var marked = require('marked');
var hljs = require('highlight.js');

exports.marked = function(val, callback, sanitize) {
    marked(val, {
        //gfm: true,
        highlight: function (code, lang) {// return code;
            if(lang) {
                return hljs.highlight(lang, code).value;
            }
            return hljs.highlightAuto(code).value;
        },
        //tables: true,
        //breaks: false,
        //pedantic: false,
        //smartypants: true,
        langPrefix: 'lang-',
        // langPrefix: '',
        headerPrefix: 'h-',
        smartypants: true,// default is false
        sanitize: undefined !== sanitize ? sanitize : true // default is false
    }, callback);
};

exports.dateFormat = dateFormat;
exports.jsonReturn = jsonReturn;
exports.prezero = prezero;
