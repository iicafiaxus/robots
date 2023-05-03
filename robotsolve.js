"REQUIRE robotsolveutil.js";
"REQUIRE util/stopwatch.js";

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
	this.atKey = function(key, iRobot, xy){
		let iPosition = iRobot * 2 + 1 - xy;
		return Math.floor((key % this.mults[iPosition + 1]) / this.mults[iPosition]);
	}

	this.goal = 0;
	for(let wall of this.walls){
		if(wall.isGoal){
			this.goal += wall.y * this.mults[wall.goalColor * 2 - 2];
			this.goal += wall.x * this.mults[wall.goalColor * 2 - 1];
			this.goalMod = this.mults[wall.goalColor * 2];
		}
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
	this.walkCount = []; // walkCount[x][y][xy][dir] : 壁にぶつからずに進める歩数
	for(let i = 0; i < this.height; i ++){
		this.walkCount.push([]);
		for(let j = 0; j < this.width; j ++){
			this.walkCount[i].push([[], []]);
			this.walkCount[i][j][0][1] = this.height - 1 - i;
			this.walkCount[i][j][0][-1] = i;
			this.walkCount[i][j][1][1] = this.width - 1 - j;
			this.walkCount[i][j][1][-1] = j;
		}
	}
	for(let wall of this.walls){
		let x = wall.x, y = wall.y;
		let dx, dy;
		if(wall.type == 1) dx = -1, dy = -1;
		if(wall.type == 2) dx = -1, dy = 1;
		if(wall.type == 3) dx = 1, dy = -1;
		if(wall.type == 4) dx = 1, dy = 1;
		this.isOpen[x][y][0][dx] = false;
		this.isOpen[x][y][1][dy] = false;
		let x2 = x + dx, y2 = y + dy;
		if(x2 >= 0 && x2 < this.height) this.isOpen[x2][y][0][-dx] = false;
		if(y2 >= 0 && y2 < this.width) this.isOpen[x][y2][1][-dy] = false;

		let x1 = (dx > 0) ? x : (x - 1);
		let y1 = (dy > 0) ? y : (y - 1);
		for(let i = 0; i < this.height; i ++){
			if(i <= x1) this.walkCount[i][y][0][1] = Math.min(this.walkCount[i][y][0][1], x1 - i);
			if(i > x1) this.walkCount[i][y][0][-1] = Math.min(this.walkCount[i][y][0][-1], i - (x1 + 1));
		}
		for(let j = 0; j < this.width; j ++){
			if(j <= y1) this.walkCount[x][j][1][1] = Math.min(this.walkCount[x][j][1][1], y1 - j);
			if(j > y1) this.walkCount[x][j][1][-1] = Math.min(this.walkCount[x][j][1][-1], j - (y1 + 1));
		}
	}

	this.walkToWall = function(key, iRobot, xy, dir){
		let x = this.atKey(key, iRobot, 0), y = this.atKey(key, iRobot, 1);
		let count = this.walkCount[x][y][xy][dir];
		for(let i = 0; i < this.nRobot; i ++){
			let xi = this.atKey(key, i, 0), yi = this.atKey(key, i, 1);
			if(xy == 0 && dir > 0 && xi > x && yi == y) count = Math.min(count, xi - 1 - x);
			if(xy == 0 && dir < 0 && xi < x && yi == y) count = Math.min(count, x - 1 - xi);
			if(xy == 1 && dir > 0 && xi == x && yi > y) count = Math.min(count, yi - 1 - y);
			if(xy == 1 && dir < 0 && xi == x && yi < y) count = Math.min(count, y - 1 - yi);
		}
		return key + this.mults[iRobot * 2 + 1 - xy] * dir * count;
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
		let k = key, k2;
		for(let dir of dirs){
			k2 = this.walkToWall(k, dir.iRobot, [0, 0, 1, 1][dir.code], [1, -1, 1, -1][dir.code]);
			for(let iRobot = 0; iRobot < this.nRobot; iRobot ++){
				if(this.atKey(k, iRobot, 0) != this.atKey(k2, iRobot, 0) ||
					this.atKey(k, iRobot, 1) != this.atKey(k2, iRobot, 1)){
					lines.push({
						iRobot,
						sx: this.atKey(k, iRobot, 0), sy: this.atKey(k, iRobot, 1),
						tx: this.atKey(k2, iRobot, 0), ty: this.atKey(k2, iRobot, 1),
					});
					break;
				}
			}
			//p = p2,
			k = k2;
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

	this.timer = new StopWatch();
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
		this.timer.start();
		this.solveInternal();
	}

	this.isWorking = true;
	this.stop = function(){
		this.isWorking = false;
	}

	this.solveInternal = function(){
		if( ! this.isWorking){
			console.log("(solver) stopped");
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

			if(this.best && this.best < v) break; // 幅優先探索のため

			for(let i = 0; i < this.nRobot; i ++){
				this.push(this.walkToWall(k, i, 0, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 0, k);
				this.push(this.walkToWall(k, i, 0, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 1, k);
				this.push(this.walkToWall(k, i, 1, 1), v + 1, d * (this.nRobot * 4) + i * 4 + 2, k);
				this.push(this.walkToWall(k, i, 1, -1), v + 1, d * (this.nRobot * 4) + i * 4 + 3, k);
			}

			if(this.iq % 5000 == 0){
				if(this.iq % 100000 == 0) console.log(`(solver) [${this.iq}] searching ${v}`);
				setTimeout(this.solveInternal.bind(this), 1);
				return;
			}
		}

		this.timer.stop();
		let ratio = Math.floor(this.timer.timeSpent / this.iq * 10000) / 100;
		console.log([
			"(solver)",
			"[" + this.iq + "]",
			(this.isAborted ? "aborted" : "done"),
			this.timer.timeSpent + "ms",
			"(" + ratio + ")",
		].join(" "));

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
			else{
				summarySet[summary] = 1;
				console.log(`(solver) [${this.iq}] found ${v}: ${description1}`);
			}
			this.descriptions.push(description1);
			this.liness.push(lines);
		}
		let result = { length: v, description, lines,
			descriptions: this.descriptions, liness: this.liness };
		this.onFound(result);

	}

}


