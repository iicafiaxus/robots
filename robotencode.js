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

	this.encodeExternal = function(param){
		let height = param.height || 16;
		let width = param.width || 16;
		let x0 = Math.floor((16 - height) / 2);
		let y0 = Math.floor((16 - width) / 2);

		let cellCodes = [];		
		let ALL_OK = 15, NG_UP = 15 - 1, NG_RIGHT = 15 - 2, NG_DOWN = 15 - 4, NG_LEFT = 15 - 8;
		for(let x = 0; x < 16; x ++){
			for(let y = 0; y < 16; y ++){
				let code = ALL_OK;
				if(y >= y0 && y < y0 + width){
					if(x == x0 || x == x0 + height) code &= NG_UP;
					if(x == x0 - 1 || x == x0 + height - 1) code &= NG_DOWN;
				}
				if(x >= x0 && x < x0 + height){
					if(y == y0 || y == y0 + width) code &= NG_LEFT;
					if(y == y0 - 1 || y == y0 + width - 1) code &= NG_RIGHT;
				}
				if(x == 0) code &= NG_UP;
				if(x == 15) code &= NG_DOWN;
				if(y == 0) code &= NG_LEFT;
				if(y == 15) code &= NG_RIGHT;
				cellCodes.push(code);
			}
		}

		let goals = [];
		for(let i = 0; i < 17; i ++){
			goals.push({ x: 15, y : 15 });
		}

		let index = function(x, y) { return y + x * 16; };
		let setWall = function(x, y, dx, dy){
			setWallInternal(x0 + x, y0 + y, dx, dy);
			setWallInternal(x0 + x + dx, y0 + y + dy, -dx, -dy);
		}
		let setWallInternal = function(x, y, dx, dy){
			if(x < 0 || x >= 16 || y < 0 || y >= 16) return;
			let z = index(x, y);
			if(dx == 1) cellCodes[z] &= NG_DOWN;
			else if(dx == -1) cellCodes[z] &= NG_UP;
			else if(dy == 1) cellCodes[z] &= NG_RIGHT;
			else if(dy == -1) cellCodes[z] &= NG_LEFT;
		}
		for(wall of param.walls){
			if(wall.type == 1) setWall(wall.x, wall.y, -1, 0), setWall(wall.x, wall.y, 0, -1);
			else if(wall.type == 2) setWall(wall.x, wall.y, -1, 0), setWall(wall.x, wall.y, 0, 1);
			else if(wall.type == 3) setWall(wall.x, wall.y, 1, 0), setWall(wall.x, wall.y, 0, -1);
			else if(wall.type == 4) setWall(wall.x, wall.y, 1, 0), setWall(wall.x, wall.y, 0, 1);
			if(wall.isGoal) goals[0] = { x: x0 + wall.x, y: y0 + wall.y };
		}

		let goalCodes = goals.flatMap(g => [g.y, g.x]);
		let robotCodes = param.robots.flatMap(r => [y0 + r.y, x0 + r.x]);
		let whichCodes = [0, 0];

		let allCodes = cellCodes.concat(goalCodes).concat(robotCodes).concat(whichCodes);
		let allCodesQuater = this.valuesToQuater(allCodes);
		let result = this.quaterTo64(allCodesQuater);
		console.log({ cellCodes, goalCodes, robotCodes, whichCodes, allCodes, allCodesQuater, result });

		return result;
	}

	this.valuesToQuater = function(values){ // values: array of 0 .. 15 incl
		let result = [];
		for(let value of values){
			result.push(Math.floor(value / 4));
			result.push(value % 4);
		}
		return result;
	}
	this.quaterTo64 = function(values){
		let n = values.length;
		if(n % 3 != 0) return "";
		let result = "";
		let letters = "0123456789" + "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "_-";
		for(let i = 0; i < n ; i += 3){
			let key = values[i] * 16 + values[i + 1] * 4 + values[i + 2];
			result += letters.charAt(key);
		}
		return result;
	}

}();