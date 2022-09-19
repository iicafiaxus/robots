let Solver = function(width, height, robots, walls){

	this.width = width, this.height = height;
	this.robots = robots || [];
	this.walls = walls || [];
	
	this.nRobot = this.robots.length;

	this.mults = [1];
	for(let m = 1, i = 0; i < this.nRobot; i ++){
		m *= this.width, this.mults.push(m);
		m *= this.height, this.mults.push(m);
	}

	this.toKey = function(position){
		let res = 0;
		for(let i = 0; i < this.nRobot; i ++){
			res += this.mults[i * 2] * position[i * 2];
			res += this.mults[i * 2 + 1] * position[i * 2 + 1];
		}
		return res;
	}
	this.fromKey = function(key){
		let position = [];
		let k = key, t;
		for(let i = 0; i < this.nRobot; i ++){
			t = k % this.mults[i * 2 + 1];
			position.push(t / this.mults[i * 2]);
			k -= t;
			t = k % this.mults[i * 2 + 2];
			position.push(t / this.mults[i * 2 + 1]);
			k -= t;
		}
		return position;
	}

	this.isOpen = []; // isOpen[x][y][xy][dir] : (x, y) から xy 方向 dir の向きに壁がない
	for(let i = 0; i < this.height; i ++){
		this.isOpen.push([]);
		for(let j = 0; j < this.width; j ++){
			this.isOpen[i].push([[], []]);
			this.isOpen[i][j][0][1] = (i < this.height - 1);
			this.isOpen[i][j][0][-1] = (i > 0);
			this.isOpen[i][j][1][1] = (j < this.width - 1);
			this.isOpen[i][j][1][-1] = (j > 0);
		}
	}
	for(let wall of this.walls){
		if(wall.isGoal) this.xGoal = wall.x, this.yGoal = wall.y;
		let dx, dy;
		if(wall.type == 1) dx = -1, dy = -1;
		if(wall.type == 2) dx = -1, dy = 1;
		if(wall.type == 3) dx = 1, dy = -1;
		if(wall.type == 4) dx = 1, dy = 1;
		this.isOpen[wall.x][wall.y][0][dx] = false;
		this.isOpen[wall.x][wall.y][1][dy] = false;
		let x2 = wall.x + dx, y2 = wall.y + dy;
		if(x2 >= 0 && x2 < this.height) this.isOpen[x2][wall.y][0][-dx] = false;
		if(y2 >= 0 && y2 < this.width) this.isOpen[wall.x][y2][1][-dy] = false;
	}
	this.goal = this.yGoal + this.xGoal * this.mults[1];


	this.canWalk = function(key, iRobot, xy, dir){
		let position = this.fromKey(key);
		let x = position[iRobot * 2 + 1], y = position[iRobot * 2];
		if( ! this.isOpen[x][y][xy][dir]) return false;
		let x2 = x, y2 = y;
		if(xy == 0) x2 += dir; else y2 += dir;
		for(let i = 0; i < this.nRobot; i ++) if(i != iRobot){
			if(position[i * 2 + 1] == x2 && position[i * 2] == y2) return false;
		}
		return true;
	}
	this.walk = function(key, iRobot, xy, dir){
		return key + this.mults[iRobot * 2 + 1 - xy] * dir;
	}
	this.walkToWall = function(key, iRobot, xy, dir){
		while(this.canWalk(key, iRobot, xy, dir)) key = this.walk(key, iRobot, xy, dir);
		return key;
	}

	// Queue
	this.array = [];
	this.kq = [], this.vq = [], this.dq = [], this.iq = -1;
	this.push = function(k, v, d){
		if(this.array[k] === void 0 || this.array[k] > v){
			this.array[k] = v, this.kq.push(k), this.vq.push(v), this.dq.push(d);
		}
	}

	this.decodeDirs = function(v, d){
		let dirs = [];
		for(let i = 0; i < v; i ++){
			let r = d % (this.nRobot * 4);
			let l = Math.floor(r / 4);
			dirs.push({iRobot: l, code: r % 4});
			d -= r;
			d /= (this.nRobot * 4);
		}
		return dirs.reverse();
	}

	this.makeDirString = function(dirs){
		let res = "", last = -1;
		for(let s of dirs){
			let l = s.iRobot, r = s.code;
			if(last != l){
				if(last != -1) res += "　";
				res += ["●", "A", "B", "C", "D", "E", "F", "G", "H"][l];
				last = l;
			}
			res += ["↓", "↑", "→", "←"][r];
		}
		return res;
	}

	this.traceLines = function(key, dirs){
		let res = [];
		let k = this.key, k2;
		let p = this.fromKey(key), p2;
		for(let dir of dirs){
			k2 = this.walkToWall(k, dir.iRobot, [0, 0, 1, 1][dir.code], [1, -1, 1, -1][dir.code]);
			p2 = this.fromKey(k2);
			for(let iRobot = 0; iRobot < this.nRobot; iRobot ++){
				if(p[iRobot * 2] != p2[iRobot * 2] || p[iRobot * 2 + 1] != p2[iRobot * 2 + 1]){
					res.push({
						iRobot,
						sx: p[iRobot * 2 + 1], sy: p[iRobot * 2],
						tx: p2[iRobot * 2 + 1], ty: p2[iRobot * 2]
					});
					break;
				}
			}
			p = p2, k = k2;
		}
		return res;
	}

	this.solve = function(onEnd){
		let position = [];
		for(let robot of this.robots) position.push(robot.y), position.push(robot.x);
		this.key = this.toKey(position);

		this.array = [], this.array[this.key] = 0;
		this.kq = [this.key], this.vq = [0], this.dq = [0], this.iq = 0; // Queue.flush

		this.onEnd = onEnd;

		console.log("solver started");
		this.solveInternal();
	}

	this.isWorking = true;
	this.stop = function(){
		this.isWorking = false;
	}

	this.solveInternal = function(){
		if( ! this.isWorking){
			console.log("solver stopped");
			return;
		}
		let k, v;
		let i;
		while(this.iq < this.kq.length){

			k = this.kq[this.iq], v = this.vq[this.iq], d = this.dq[this.iq], this.iq ++; // Queue.pop

			if(k % this.mults[2] == this.goal){
				console.log(`(solver) found in ${this.iq}`);
				console.log(`(solver) answer: ${v}`);
				let dirs = this.decodeDirs(v, d);
				let description = this.makeDirString(dirs);
				console.log(`(solver) ${description}`);
				let lines = this.traceLines(this.key, dirs);
				let result = { length: v, description, lines };
				this.onEnd(result);
				return;
			}

			for(i = 0; i < this.nRobot; i ++){
				// ●が最後に連続して動く解を優先したいなら降順
				this.push(this.walkToWall(k, i, 0, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 0);
				this.push(this.walkToWall(k, i, 0, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 1);
				this.push(this.walkToWall(k, i, 1, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 2);
				this.push(this.walkToWall(k, i, 1, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 3);
			}

			if(this.iq > 4000000){
				console.log(`(solver) aborted in ${this.iq}`);
				this.onEnd({ length: -1, description: "解が見つかりませんでした" });
				return;
			}
			else if(this.iq % 20000 == 0){
				console.log(`(solver) searching ${this.iq}`);
				setTimeout(this.solveInternal.bind(this), 1);
				return;
			}
		}
	}

}


