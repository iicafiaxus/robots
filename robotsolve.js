"REQUIRE robotsolveutil.js";

let Solver = function(width, height, robots, walls){

	this.width = width, this.height = height;
	this.robots = robots || [];
	this.walls = walls || [];
	
	this.nRobot = this.robots.length;

	this.util = new RobotSolveUtil({ nRobot: this.nRobot	});

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
	this.goal = 0;
	for(let wall of this.walls){
		if(wall.isGoal){
			this.goal += wall.y * this.mults[wall.goalColor * 2 - 2];
			this.goal += wall.x * this.mults[wall.goalColor * 2 - 1];
			this.goalMod = this.mults[wall.goalColor * 2];
		}
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


	this.canWalk = function(position, iRobot, xy, dir){
		let x = position[iRobot * 2 + 1], y = position[iRobot * 2];
		if( ! this.isOpen[x][y][xy][dir]) return false;
		if(xy == 0) x += dir; else y += dir;
		for(let i = 0; i < this.nRobot; i ++) if(i != iRobot){
			if(position[i * 2 + 1] == x && position[i * 2] == y) return false;
		}
		return true;
	}
	this.walk = function(key, iRobot, xy, dir){
		return key + this.mults[iRobot * 2 + 1 - xy] * dir;
	}
	this.walkToWall = function(key, iRobot, xy, dir){
		let position = this.fromKey(key);
		let iPosition = iRobot * 2 + 1 - xy;
		while(this.canWalk(position, iRobot, xy, dir)) position[iPosition] += dir;
		return this.toKey(position);
	}

	// Queue
	this.array = [];
	this.kq = [], this.dq = [], this.iq = -1;
	this.backs = [];

	this.push = function(k, v, d, k0){
		if(this.kq.length > 4000000){
			this.isAborted = true;
			return;
		}
		if( ! this.best){
			if(this.array[k] === void 0 || this.array[k] > v){
				this.array[k] = v, this.kq.push(k), this.dq.push(d);
			}
		}
		if(this.array[k] == v){
			if( ! this.backs[k]) this.backs[k] = [k0];
			else this.backs[k].push(k0);
		}
	}

	this.traceBacks = function(k){
		if(k == this.key) return [[k]];
		let traces = [];
		for(let back of this.backs[k]){
			let subs = this.traceBacks(back);
			for(let sub of subs){
				let x = sub.slice();
				x.push(k);
				traces.push(x);
			}
		}
		return traces;
	}

	this.decodeTrace = function(trace){
		let dirs = [];
		for(let i = 0; i < trace.length - 1; i ++){
			let diff = trace[i + 1] - trace[i];
			let dir;
			for(let iRobot = 0; iRobot < this.nRobot; iRobot ++){
				if(diff % this.mults[iRobot * 2] == 0) dir = {iRobot, code: (diff > 0 ? 2 : 3)};
				if(diff % this.mults[iRobot * 2 + 1] == 0) dir = {iRobot, code: (diff > 0 ? 0 : 1)};
			}
			dirs.push(dir);
		}
		return dirs;
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
	this.makeLineString = function(lines){
		let us = [];
		for(let i = 0; i < this.nRobot; i ++) us[i] = [];
		for(let l of lines){
			if(us[l.iRobot].length == 0) us[l.iRobot].push({x: l.sx, y: l.sy});
			us[l.iRobot].push({x: l.tx, y: l.ty});
		}
		let res = "";
		for(let i = 0; i < this.nRobot; i ++){
			res += i + ": " + us[i].map(u => `(${u.x}, ${u.y})`).join("→") + "\n";
		}
		return res;
	}

	this.traceLines = function(key, dirs){
		let lines = [];
		let k = this.key, k2;
		let p = this.fromKey(key), p2;
		for(let dir of dirs){
			k2 = this.walkToWall(k, dir.iRobot, [0, 0, 1, 1][dir.code], [1, -1, 1, -1][dir.code]);
			p2 = this.fromKey(k2);
			for(let iRobot = 0; iRobot < this.nRobot; iRobot ++){
				if(p[iRobot * 2] != p2[iRobot * 2] || p[iRobot * 2 + 1] != p2[iRobot * 2 + 1]){
					lines.push({
						iRobot,
						sx: p[iRobot * 2 + 1], sy: p[iRobot * 2],
						tx: p2[iRobot * 2 + 1], ty: p2[iRobot * 2]
					});
					break;
				}
			}
			p = p2, k = k2;
		}
		return { lines, key: k };
	}

	this.isDirsGood = function(dirs){
		let key = this.traceLines(this.key, dirs).key;
		return (key % this.goalMod == this.goal);
	}

	this.normalize = function(dirs){
		let n = dirs.length;
		let res = [];
		for(let dir of dirs) res.push(dir);
		
		for(let j = n - 1; j > 0; j --){
			for(let i = j - 1; i >= 0; i --){
				if(res[i].iRobot == res[j].iRobot){
					let tmp = [];
					for(re of res.slice(0, i)) tmp.push(re);
					for(re of res.slice(i + 1, j)) tmp.push(re);
					tmp.push(res[i]);
					for(re of res.slice(j, n)) tmp.push(re);
					if(this.isDirsGood(tmp)) res = tmp;
					break;
				}
			}
		}
		return res;
	}

	this.solve = function(onFound, onEnd){
		let position = [];
		for(let robot of this.robots) position.push(robot.y), position.push(robot.x);
		this.key = this.toKey(position);

		this.array = [], this.array[this.key] = 0;
		this.kq = [this.key], this.dq = [0], this.iq = 0; // Queue.flush

		this.onFound = onFound;
		this.onEnd = onEnd;

		this.best = 0;
		this.descriptions = [];
		this.liness = [];

		console.log("(solver) searching...");
		this.solveInternal();
	}

	this.isWorking = true;
	this.stop = function(){
		this.isWorking = false;
	}

	this.solveInternal = function(){
		if( ! this.isWorking){
			console.log("(solver) stopped.");
			if(this.onEnd) this.onEnd();
			return;
		}

		while(this.iq < this.kq.length){
			let k = this.kq[this.iq], d = this.dq[this.iq];
			let v = this.array[k];
			this.iq ++; // Queue.pop

			if(k % this.goalMod == this.goal && ( ! this.best || this.best == v)){
				this.best = v;
				let traces = this.traceBacks(k);
				let ds = traces.map(this.decodeTrace.bind(this));
				this.success(v, d, ds);
			}

			for(let i = 0; i < this.nRobot; i ++){
				this.push(this.walkToWall(k, i, 0, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 0, k);
				this.push(this.walkToWall(k, i, 0, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 1, k);
				this.push(this.walkToWall(k, i, 1, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 2, k);
				this.push(this.walkToWall(k, i, 1, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 3, k);
			}

			if(this.iq % 5000 == 0){
				if(this.iq % 100000 == 0) console.log(`(solver) searching: ${this.iq}`);
				setTimeout(this.solveInternal.bind(this), 1);
				return;
			}
		}
		if(this.isAborted) console.log(`(solver) aborted in ${this.iq}`);
		else console.log(`(solver) done in ${this.iq}`);

		if( ! this.best) this.onFound({ length: 0, description: "解が見つかりませんでした",
			descriptions: ["解が見つかりませんでした"] });

		this.isWorking = false;
		if(this.onEnd) this.onEnd();
	}

	this.success = function(v, d, ds){
		let d0 = d; //ds[0];
		let dirs = this.normalize(this.decodeDirs(v, d0));
		let description = this.makeDirString(dirs);
		let lines = this.traceLines(this.key, dirs).lines;
		let summarySet = {}; // 本当はSetにする
		for(let d1 of ds){
			let dirs1 = this.normalize(d1);
			let description1 = this.makeDirString(dirs1);
			let lines = this.traceLines(this.key, dirs1).lines;
			let lineString = this.makeLineString(lines);
			let summary = lineString;
			if(summary in summarySet) continue;
			else summarySet[summary] = 1;
			this.descriptions.push(description1);
			this.liness.push(lines);
		}
		let result = { length: v, description, lines,
			descriptions: this.descriptions, liness: this.liness };
		console.log(`(solver) found in ${this.iq}`);
		this.descriptions.map(x => console.log(`(solver) ${v}: ${x}`));
		this.onFound(result);

	}

}


