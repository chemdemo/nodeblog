exports.split = function(input, glue) {
    return input.split(glue);
}

exports.length = function(input) {
    return input.length;
}

exports.genLink = function(input) {
    return /^(htt(?:p|ps):\/\/).*/.test(input) ? input : 'http://' + input;
}

exports.countFormat = function(input) {// 2013/08 --> 2013年08月
    var a = input.split(/\//);
    return a[0] + '年' + a[1] + '月';
}
