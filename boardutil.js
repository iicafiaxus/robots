const boardUtil = {};
boardUtil.calc = function(robots, lines){
	let lineRoutes = robots.map(_ => []);
	for(let line of lines){
		(lineRoutes[line.iRobot] ||= []).push(line);
	}

	let lineRows = [], lineColumns = [];
	for(let line of lines) lineRows[line.sx] ||= [], lineColumns[line.sy] ||= [];
	for(let line of lines){
		if(line.sx == line.tx) lineRows[line.sx].push(line), line.isWidthSide = true;
		if(line.sy == line.ty) lineColumns[line.sy].push(line), line.isHeightSide = true;
		line.x1 = Math.min(line.sx, line.tx), line.x2 = Math.max(line.sx, line.tx);
		line.y1 = Math.min(line.sy, line.ty), line.y2 = Math.max(line.sy, line.ty);
	}

	for(let lineRow of lineRows) if(lineRow) {
		let i = 0, n = 1, sublines = [];
		let max = -1;
		for(let line of lineRow.sort((a, b) => a.y1 - b.y1)){
			if(max <= line.y1) i = 0, n = 0, sublines = [];
			line.iRowTrack = i;
			i += 1, n += 1, sublines.push(line);
			for(let l of sublines) l.nRowTrack = n;
			max = Math.max(max, line.y2);
		}
	}
	for(let lineColumn of lineColumns) if(lineColumn) {
		let i = 0, n = 1, sublines = [];
		let max = -1;
		for(let line of lineColumn.sort((a, b) => a.x1 - b.x1)){
			if(max <= line.x1) i = 0, n = 0, sublines = [];
			line.iColumnTrack = i;
			i += 1, n += 1, sublines.push(line);
			for(let l of sublines) l.nColumnTrack = n;
			max = Math.max(max, line.x2);
		}
	}
	for(let line of lines){
		line.dx = line.iRowTrack - (line.nRowTrack - 1) / 2;
		line.dy = line.iColumnTrack - (line.nColumnTrack - 1) / 2;
	}

	for(let lineRoute of lineRoutes){
		for(let i = 0; i < lineRoute.length - 1; i ++){
			let l = lineRoute[i], l1 = lineRoute[i + 1];
			if(l.isWidthSide && l1.isHeightSide){
				l.dty = l1.dy + (l.sy < l.ty ? -0.5 : 0.5);
				l1.dsx = l.dx;
			}
			if(l.isHeightSide && l1.isWidthSide){
				l.dtx = l1.dx + (l.sx < l.tx ? -0.5 : 0.5);
				l1.dsy = l.dy;
			}
		}
	}

	for(let r of robots) r.dx = 0, r.dy = 0;
	for(let lineRoute of lineRoutes){
		let l = lineRoute[0];
		if(l){
			if(l.isWidthSide) l.dsy = (l.sy < l.ty ? 2 : -2); else l.dsy = 0;
			if(l.isHeightSide) l.dsx = (l.sx < l.tx ? 2 : -2); else l.dsx = 0;
			robots[l.iRobot].dx = (l.dx || 0);
			robots[l.iRobot].dy = (l.dy || 0);
		}
	}

	let minirobots = [];
	for(let lineRoute of lineRoutes){
		let l = lineRoute[lineRoute.length - 1];
		if(l){
			if(l.isWidthSide) l.dty = (l.sy < l.ty ? -2 : 2); else l.dty = 0;
			if(l.isHeightSide) l.dtx = (l.sx < l.tx ? -2 : 2); else l.dtx = 0;
			minirobots.push({
				key: l.iRobot + 1,
				iRobot: l.iRobot,
				x: l.tx, y: l.ty,
				dx: (l.dx || 0) + l.dtx * 0.5, dy: (l.dy || 0) + l.dty * 0.5,
				isMain: robots[l.iRobot].isMain
			});
		}
	}

	return [lineRoutes, minirobots];
};