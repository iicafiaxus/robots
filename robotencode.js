let encoder = new function(){
	this.encode = function(param){
		let lines = ["v0"];

		let zValue = {
			"small": "88,0",
			"medium": "C8,1",
			"large": "EA,1",
			"large2": "GC,1",
			"large3": "GG,1",
		}[param.paramName];
		lines.push("z" + zValue);

		let encodePoint = function(x, y){
			let letters = "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			let xStr = letters.charAt(+x);
			let yStr = letters.charAt(+y);
			return xStr + yStr;
		}

		let encodePosition = function(object){
			return encodePoint(object.x, object.y);
		}

		let mainRobot = param.robots.filter(r => r.isMain)[0];
		let rValue = encodePosition(mainRobot);
		lines.push("r" + rValue);

		let otherRobots = param.robots.filter(r => ! r.isMain);
		let qValue = otherRobots.map(encodePosition).join("");
		lines.push("q" + qValue);

		let encodeType = function(type){
			return {
				"2": "3",
				"4": "6",
				"3": "C",
				"1": "9",
			}["" + type];
		}

		let encodeWalls = function(walls){
			if(walls.length == 0) return "3,";
			let dir = encodeType(walls[0].type);
			return dir + "," + walls.map(encodePosition).join("");
		}

		let goalWalls = param.walls.filter(w => w.isGoal);
		let gValue = encodeWalls(goalWalls);
		lines.push("g" + gValue);

		let otherWalls = param.walls.filter(w => ! w.isGoal && ! w.isShade);
		let wallTypes = new Set(otherWalls.map(w => w.type));
		console.log({wallTypes});
		for(let type of wallTypes){
			let wValue = encodeWalls(otherWalls.filter(w => w.type == type));
			lines.push("w" + wValue);
		}

		return lines.join(";");
	};
}();