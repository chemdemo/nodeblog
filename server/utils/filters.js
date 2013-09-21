exports.split = function(input, glue) {
	return input.split(glue);
}

exports.length = function(input) {
	return input.length;
}

exports.genLink = function(input) {
	return /^(htt(?:p|ps):\/\/).*/.test(input) ? input : 'http://' + input;
}