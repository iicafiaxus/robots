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
				let isGoal = i == 0;
				i += 1, walls.push({x, y, type, isGoal});
			}
		}

		let robots = [];		
		let isGoodRobot = function(x, y){
			for(let wall of walls) if(x == wall.x && y == wall.y && ++cnt < cntLimit) return false;
			for(let robot of robots) if(x == robot.x && y == robot.y && ++cnt < cntLimit) return false;
			return true;
		}
		for(let i = 0; i < 4; ){
			let x = Math.floor(Math.random() * height);
			let y = Math.floor(Math.random() * width);
			let isMain = i == 0;
			if(isGoodRobot(x, y)) i += 1, robots.push({ key: i, x, y, isMain });
		}

		if(cnt >= cntLimit) return this.makeMapInternal(param, totalCount + 1);
		else{
			console.log("(make map) done");
			return { walls, robots };
		}
	}
}();