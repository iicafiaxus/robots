let RobotSolveUtil = function(param){
	this.param = {
		nRobot: 4,
		mults: [],
		...param
	}

	
}

RobotSolveUtil.prototype.makeDirString = function(dirs){
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

RobotSolveUtil.prototype.makeLineString = function(lines){
	let us = [];
	for(let i = 0; i < this.param.nRobot; i ++) us[i] = [];
	for(let l of lines){
		if(us[l.iRobot].length == 0) us[l.iRobot].push({x: l.sx, y: l.sy});
		us[l.iRobot].push({x: l.tx, y: l.ty});
	}
	let res = "";
	for(let i = 0; i < this.param.nRobot; i ++){
		res += i + ": " + us[i].map(u => `(${u.x}, ${u.y})`).join("→") + "\n";
	}
	return res;
}

RobotSolveUtil.prototype.decodeTrace = function(trace){
	let dirs = [];
	for(let i = 0; i < trace.length - 1; i ++){
		let diff = trace[i + 1] - trace[i];
		let dir;
		for(let iRobot = 0; iRobot < this.param.nRobot; iRobot ++){
			if(diff % this.param.mults[iRobot * 2] == 0) dir = {iRobot, code: (diff > 0 ? 2 : 3)};
			if(diff % this.param.mults[iRobot * 2 + 1] == 0) dir = {iRobot, code: (diff > 0 ? 0 : 1)};
		}
		dirs.push(dir);
	}
	return dirs;
}
