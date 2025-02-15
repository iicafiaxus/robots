let encoder = new function(){
	this.encode = function(param){
		let lines = ["v01"];

		let zValue = {
			"small": "88,0",
			"medium": "C8,1",
			"large": "EA,1",
			"large2": "GC,1",
			"large3": "GG,1",
		}[param.sizeName];
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

		let walls = param.walls.filter(w => ! w.isShade);
		let wallTypes = new Set(walls.map(w => w.type));
		for(let type of wallTypes){
			let wValue = encodeWalls(walls.filter(w => w.type == type));
			lines.push("w" + wValue);
		}

		let mainRobots = param.robots.filter(r => r.isMain);
		let rValue = mainRobots.map(encodePosition).join("");
		lines.push("r" + rValue);

		let otherRobots = param.robots.filter(r => ! r.isMain);
		if(otherRobots.length){
			let qValue = otherRobots.map(encodePosition).join("");
			lines.push("q" + qValue);
		}

		let goalWalls = param.walls
			.filter(w => w.isGoal)
			.sort((a, b) => a.goalColor - b.goalColor);
		let gValue = goalWalls.map(encodePosition).join("");
		lines.push("g" + gValue);

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
				if((x <= x0 - 1 || y <= y0 - 1 || x >= x0 + height || y >= y0 + width) &&
					(y >= 1 || x >= 1)){
					///*x >= x0 - 1 && */y >= y0 - 1 && /*x <= x0 + height && */1/*y <= y0 + width*/){
					code = 0;
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
			goals.push({ x: 0, y : 0 });
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
		let setShade = function(x, y){
				setWall(x, y, -1, 0), setWall(x, y, 1, 0), setWall(x, y, 0, -1), setWall(x, y, 0, 1);
		}

		let goalCount = 0;
		let goalColor = 0;
		for(wall of param.walls){
			if(wall.isShade) setShade(wall.x, wall.y);
			else{
				if(wall.type == 1) setWall(wall.x, wall.y, -1, 0), setWall(wall.x, wall.y, 0, -1);
				else if(wall.type == 2) setWall(wall.x, wall.y, -1, 0), setWall(wall.x, wall.y, 0, 1);
				else if(wall.type == 3) setWall(wall.x, wall.y, 1, 0), setWall(wall.x, wall.y, 0, -1);
				else if(wall.type == 4) setWall(wall.x, wall.y, 1, 0), setWall(wall.x, wall.y, 0, 1);
				if(wall.isGoal){
					goalColor = wall.goalColor || 1;
					goals[wall.goalColor - 1] = { x: x0 + wall.x, y: y0 + wall.y };
					goalCount += 1;
				}
			}
		}

		let goalCodes = goals.flatMap(g => [g.y, g.x]);
		let robotCodes = param.robots.flatMap(r => [y0 + r.y, x0 + r.x]);
		let whichCodes = (goalCount > 1) ? [4, 4] : [goalColor - 1, 0];

		let allCodes = cellCodes.concat(goalCodes).concat(robotCodes).concat(whichCodes);
		let allCodesQuater = this.valuesToQuater(allCodes);
		let result = this.quaterTo64(allCodesQuater);

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