let save = function(key, value){
	localStorage.setItem("robots_" + key, "" + value);
}
let load = function(key){
	return localStorage.getItem("robots_" + key);
}
let remove = function(key){
	localStorage.removeItem("robots_" + key);
}