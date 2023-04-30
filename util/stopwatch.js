let StopWatch = function(){
	this.timeSpent = 0;
	this.startTime = 0;
	this.isRunning = false;
}
StopWatch.prototype.start = function(){
	if(this.isRunning) throw new Error("StopWatch already running.");
	else this.isRunning = true;
	this.startTime = Date.now();
}
StopWatch.prototype.stop = function(){
	if( ! this.isRunning) throw new Error("StopWatch already running.");
	else this.isRunning = false;
	this.timeSpent += Date.now() - this.startTime;
}
StopWatch.prototype.reset = function(){
	this.timeSpent = 0;
	this.startTime = 0;
	this.isRunning = false;
}
