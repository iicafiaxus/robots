let mapMaker = new function(){

	this.make = function(param){
		console.log("(make map) making...");
		return this.makeMapInternal(param, 0);
	};

	this.makeMapInternal = function(param, totalCount){
		if(totalCount > 20){
			return { walls: [], robots: [{ key: 0, x: 0, y: 0, isMain: true }]};
		}
		if(totalCount > 0) console.log("(make map) retrying: " + totalCount);
		let cnt = 0, cntLimit = 80;

		let width = Math.max(param.width, 6);
		let height = Math.max(param.height, 6);

		let goalCount = param.goalCount || 1;

		let walls = [];
		let isGood = function(x, y){
			for(let wall of walls) if(Math.abs(x - wall.x) <= 1 &&
				Math.abs(y - wall.y) <= 1 && ++cnt < cntLimit) return false;
			return true;
		}
		if(param.hasCenterWall){
			let x = Math.floor(height / 2), y = Math.floor(width / 2);
			walls.push({x: x - 1, y: y - 1, type: 1, isShade: true});
			walls.push({x: x - 1, y: y, type: 2, isShade: true});
			walls.push({x: x, y: y - 1, type: 3, isShade: true});
			walls.push({x: x, y: y, type: 4, isShade: true});
		}
		for(let i = 0; i < param.widthSideCount || 0; ){
			let y = Math.floor(Math.random() * (width - 3)) + 2;
			if(isGood(0, y)) i += 1, walls.push({x: 0, y, type: 1});
		}
		for(let i = 0; i < param.widthSideCount || 0; ){
			let y = Math.floor(Math.random() * (width - 3)) + 2;
			if(isGood(height - 1, y)) i += 1, walls.push({x: height - 1, y, type: 3});
		}
		for(let i = 0; i < param.heightSideCount || 0; ){
			let x = Math.floor(Math.random() * (height - 3)) + 2;
			if(isGood(x, 0)) i += 1, walls.push({x, y: 0, type: 1});
		}
		for(let i = 0; i < param.heightSideCount || 0; ){
			let x = Math.floor(Math.random() * (height - 3)) + 2;
			if(isGood(x, width - 1)) i += 1, walls.push({x, y: width - 1, type: 2});
		}
		
		for(let i = 0; i < param.cornerCount || 0; ){
			let x = Math.floor(Math.random() * (height - 2)) + 1;
			let y = Math.floor(Math.random() * (width - 2)) + 1;
			let type = Math.floor(Math.random() * 4) + 1;
			if(isGood(x, y)){
				let isGoal = i < goalCount;
				i += 1, walls.push({ x, y, type, isGoal, goalColor: isGoal ? i : null });
			}
		}

		let isGoodWalls = function(walls){
			let cnt00 = 0, cnt01 = 0, cnt02 = 0, cnt10 = 0, cnt11 = 0, cnt12 = 0, cnt20 = 0, cnt21 = 0, cnt22 = 0;
			for(let wall of walls){
				let x0 = wall.x < height / 2;
				let x1 = wall.x >= height / 4 && wall.x < height * 3 / 4;
				let x2 = wall.x >= height / 2;
				let y0 = wall.y < width / 2;
				let y1 = wall.y >= width / 4 && wall.y < width * 3 / 4;
				let y2 = wall.y >= width / 2;
				if(x0 && y0) cnt00 += 1;
				if(x0 && y1) cnt01 += 1;
				if(x0 && y1) cnt02 += 1;
				if(x1 && y0) cnt10 += 1;
				if(x1 && y1) cnt11 += 1;
				if(x1 && y1) cnt12 += 1;
				if(x2 && y0) cnt20 += 1;
				if(x2 && y1) cnt21 += 1;
				if(x2 && y1) cnt22 += 1;
			}
			let max = Math.max(cnt00, cnt01, cnt02, cnt10, cnt11, cnt12, cnt20, cnt21, cnt22);
			let min = Math.min(cnt00, cnt01, cnt02, cnt10, cnt11, cnt12, cnt20, cnt21, cnt22);
			if(max - min <= 2) return true;
			else return false;
		}
		if( ! isGoodWalls(walls)) return this.makeMapInternal(param, totalCount + 1);

		let robots = [];		
		let isGoodRobot = function(x, y){
			for(let wall of walls) if(x == wall.x && y == wall.y && ++cnt < cntLimit) return false;
			for(let robot of robots) if(x == robot.x && y == robot.y && ++cnt < cntLimit) return false;
			return true;
		}
		for(let i = 0; i < 4; ){
			let x = Math.floor(Math.random() * height);
			let y = Math.floor(Math.random() * width);
			let isMain = i < goalCount;
			if(isGoodRobot(x, y)) i += 1, robots.push({ key: i, x, y, isMain });
		}

		if(cnt >= cntLimit) return this.makeMapInternal(param, totalCount + 1);
		else{
			console.log("(make map) done");
			return { walls, robots };
		}
	}
}();