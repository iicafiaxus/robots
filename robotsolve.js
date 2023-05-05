"REQUIRE robotsolveutil.js";
"REQUIRE util/stopwatch.js";

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

	this.util = new RobotSolveUtil({
		nRobot: this.nRobot,
		mults: this.mults,
	});

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

	this.walkCount = [];
		// walkCount[x * width + y][d] : 壁にぶつからずに進める歩数
		// d: { 0: x++, 1: x--, 2: y++, 3: y-- }
	for(let i = 0; i < this.height; i ++) for(let j = 0; j < this.width; j ++){
		this.walkCount.push([
			this.height - 1 - i,
			i,
			this.width - 1 - j,
			j
		]);
	}
	for(let wall of this.walls){
		let x = wall.x, y = wall.y;
		let x1, y1;
		if(wall.type == 1) x1 = x - 1, y1 = y - 1;
		if(wall.type == 2) x1 = x - 1, y1 = y;
		if(wall.type == 3) x1 = x, y1 = y - 1;
		if(wall.type == 4) x1 = x, y1 = y;

		for(let i = 0; i < this.height; i ++){
			let z = i * this.width + y;
			if(i <= x1) this.walkCount[z][0] = Math.min(this.walkCount[z][0], x1 - i);
			if(i > x1) this.walkCount[z][1] = Math.min(this.walkCount[z][1], i - (x1 + 1));
		}
		for(let j = 0; j < this.width; j ++){
			let z = x * this.width + j;
			if(j <= y1) this.walkCount[z][2] = Math.min(this.walkCount[z][2], y1 - j);
			if(j > y1) this.walkCount[z][3] = Math.min(this.walkCount[z][3], j - (y1 + 1));
		}
	}

	this.walkToWall = function(key, iRobot, dirCode){
		let x = this.atKey(key, iRobot, 0), y = this.atKey(key, iRobot, 1);
		let count = this.walkCount[x * this.width + y][dirCode];
		for(let i = 0; i < this.nRobot; i ++){
			let xi = this.atKey(key, i, 0), yi = this.atKey(key, i, 1);
			if(dirCode == 0 && xi > x && yi == y) count = Math.min(count, xi - 1 - x);
			if(dirCode == 1 && xi < x && yi == y) count = Math.min(count, x - 1 - xi);
			if(dirCode == 2 && xi == x && yi > y) count = Math.min(count, yi - 1 - y);
			if(dirCode == 3 && xi == x && yi < y) count = Math.min(count, y - 1 - yi);
		}
		if(dirCode == 0) return key + this.mults[iRobot * 2 + 1] * count;
		if(dirCode == 1) return key - this.mults[iRobot * 2 + 1] * count;
		if(dirCode == 2) return key + this.mults[iRobot * 2] * count;
		if(dirCode == 3) return key - this.mults[iRobot * 2] * count;
	}

	// Queue
	this.array = [];
	this.kq = [], this.iq = -1;
	this.backs = [];

	this.traceBacks = function(k){
		if(k == this.key) return [[k]];
		let traces = [];
		if( ! Array.isArray(this.backs[k])) this.backs[k] = [this.backs[k]];
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

	this.traceLines = function(key, dirs){
		let lines = [];
		let k = key, k2;
		for(let dir of dirs){
			k2 = this.walkToWall(k, dir.iRobot, dir.code);
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

	this.isWorking = true;
	this.stop = function(){
		this.isWorking = false;
		Solver.isWorking = false;
	}

}

Solver.prototype.solve = function(onFound, onEnd){
	let position = [];
	for(let robot of this.robots) position.push(robot.y), position.push(robot.x);
	this.key = this.toKey(position);

	this.array = [], this.array[this.key] = 0;
	this.kq = [this.key], this.iq = 0; // Queue.flush

	this.onFound = onFound;
	this.onEnd = onEnd;

	this.best = 0;
	this.descriptions = [];
	this.liness = [];

	this.startSolving();
}

Solver.isWorking = false;

Solver.prototype.startSolving = function(){
	if(Solver.isWorking){
		setTimeout(this.startSolving.bind(this), 500);
		return;
	}
	Solver.isWorking = true;
	console.log("(solver) searching...");
	this.timer.start();
	this.solveInternal();
}

Solver.prototype.solveInternal = function(){
	if( ! this.isWorking){
		console.log("(solver) stopped");
		if(this.onEnd) this.onEnd();
		return;
	}

	while(this.iq < this.kq.length){
		let k = this.kq[this.iq];
		let v = this.array[k];
		this.iq ++; // Queue.pop

		if(k % this.goalMod == this.goal && ( ! this.best || this.best == v)){
			this.best = v;
			console.log([
				"(solver)",
				"[" + this.iq + "]",
				"found",
				this.best,
			].join(" "));
			let traces = this.traceBacks(k);
			console.log([
				"(solver)",
				"[" + this.iq + "]",
				`${traces.length} possible`,
				traces.length > 1 ? "solutions" : "solution"
			].join(" "));
			let ds = traces.map(tr => this.util.decodeTrace(tr));
			this.success(v, ds);
		}

		if(this.best && this.best < v) break; // 幅優先探索のため

		if( ! this.best){ // 幅優先なのでbestが存在するときはしなくてよい
			let v1 = v + 1; // 幅優先なので this.array[k1] > v1 となることはない
			for(let i = 0; i < this.nRobot; i ++){
				for(let code = 0; code <= 3; code ++){
					let k1 = this.walkToWall(k, i, code);
					if( ! this.array[k1]) this.array[k1] = v1, this.kq.push(k1);
					if(this.array[k1] < v1) continue;
					if( ! this.backs[k1]) this.backs[k1] = k;
					else if( ! Array.isArray(this.backs[k1])) this.backs[k1] = [this.backs[k1], k];
					else this.backs[k1].push(k);
				}
			}
		}

		if(this.kq.length > 8000000){
			this.isAborted = true;
			break;
		}

		if(this.iq % 5000 == 0){
			if(this.iq % 100000 == 0) console.log(`(solver) [${this.iq}] searching ${v}`);
			setTimeout(this.solveInternal.bind(this), 0);
			return;
		}
	}

	this.timer.stop();
	let ratio = Math.floor(this.timer.timeSpent / this.iq * 10000) / 10;
	console.log([
		"(solver)",
		"[" + this.iq + "]",
		(this.isAborted ? "aborted" : "done"),
		(Math.floor(this.timer.timeSpent / 100) / 10) + "s",
		"(" + ratio + "s/1M)",
	].join(" "));

	if( ! this.best) this.onFound({ length: 0, descriptions: ["解が見つかりませんでした"] });

	this.stop();
	if(this.onEnd) this.onEnd();
}

Solver.prototype.success = function(v, ds){
	let summarySet = {}; // 本当はSetにする
	for(let d1 of ds){
		let dirs1 = this.normalize(d1);
		let description1 = this.util.makeDirString(dirs1);
		let lines = this.traceLines(this.key, dirs1).lines;
		let lineString = this.util.makeLineString(lines);
		let summary = lineString;
		if(summary in summarySet) continue;
		else{
			summarySet[summary] = 1;
			console.log(`(solver) [${this.iq}] found ${v}: ${description1}`);
		}
		this.descriptions.push(description1);
		this.liness.push(lines);
	}
	let result = { length: v, descriptions: this.descriptions, liness: this.liness };
	this.onFound(result);
};

