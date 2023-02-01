let Cell = function(props){
	return <div
		className={
			"cell" + 
			(props.isShade ? " shade" : "")
		}
		style={{
			gridRow: (props.x || 0) + 1,
			gridColumn: (props.y || 0) + 1
		}}
	>	
		{ props.wallX ? <WallX /> : null }
		{ props.wallXBack ? <WallXBack /> : null }
		{ props.wallY ? <WallY /> : null }
		{ props.wallYBack ? <WallYBack /> : null }
		{ props.isGoal ? <Goal /> : null }
	</div>
}

let Robot = function(props){
	let du = 6;
	return <div
		className={"robot" + (props.isMain ? " main" : "")}
		style={{
			gridRow: (props.x || 0) + 1,
			gridColumn: (props.y || 0) + 1,
			top: props.dx * du + "px",
			left: props.dy * du + "px"
		}}
	>
		{props.number ? ["", "A", "B", "C", "D", "E", "F", "G", "H"][props.number] : null }
	</div>	
}

let MiniRobot = function(props){
	let du = 6;
	return <div
		className={"robot minirobot" + (props.isMain ? " main" : "")}
		style={{
			gridRow: (props.x || 0) + 1,
			gridColumn: (props.y || 0) + 1,
			top: props.dx * du + "px",
			left: props.dy * du + "px"
		}}
	>
	</div>
}

let TraceLine = function(props){
	let dx = props.dx || 0, dy = props.dy || 0;
	let dsx = props.dsx || 0, dtx = props.dtx || 0;
	let dsy = props.dsy || 0, dty = props.dty || 0;
	let dx1, dx2, dy1, dy2;
	if(props.sx < props.tx || props.sx == props.tx && dsx < dtx)
		dx1 = dsx, dx2 = dtx; else dx1 = dtx, dx2 = dsx;
	if(props.sy < props.ty || props.sy == props.ty && dsy < dty)
		dy1 = dsy, dy2 = dty; else dy1 = dty, dy2 = dsy;
	let x1 = Math.min(props.sx, props.tx), x2 = Math.max(props.sx, props.tx);
	let y1 = Math.min(props.sy, props.ty), y2 = Math.max(props.sy, props.ty);
	let xoff = dx2 - dx1, yoff = dy2 - dy1;
	let du = 6;
	return <div
		className={"trace" + (props.i == "0" ? " main" : "")}
		style={{
			gridRow: (x1 + 1) + " / " + (x2 + 2),
			gridColumn: (y1 + 1) + " / " + (y2 + 2),
			top: (dx + dx1 + (xoff > 0 ? xoff / 2 : 0)) * du + "px",
			left: (dy + dy1 + (yoff > 0 ? yoff / 2 : 0)) * du + "px",
			paddingBottom: xoff > 0 ? xoff * du + "px" : "0",
			paddingRight: yoff > 0 ? yoff * du + "px" : "0",
			clipPath: "inset( -1px " + (yoff < 0 ? -yoff * du + "px" : "-1px") + " " +
				(xoff < 0 ? -xoff * du + "px" : "-1px") + " -1px)"
		}}
	></div>
}

let Board = function(props){
	let height = props.height || 16
	let width = props.width || 16

	let [isPressed, setIsPressed] = React.useState(false);
	let [isClicking, setIsClicking] = React.useState(false);
	let [origin, setOrigin] = React.useState({x: 0, y: 0});
	let [point, setPoint] = React.useState({x: 0, y: 0});
	let [dragDistance, setDragDistance] = React.useState(0);
	let [isDragging, setIsDragging] = React.useState(false);
	let [isDiscarding, setIsDiscarding] = React.useState(false);

	let startPress = function(ev){
		setIsPressed(true);
		setIsClicking(true);
		setOrigin({
			x: ev.clientX || ev.touches[0] && ev.touches[0].clientX,
			y: ev.clientY || ev.touches[0] && ev.touches[0].clientY
		});
	}

	let movePress = function(ev){
		if( ! isPressed) return;
		if( ! ev.buttons && ! (ev.touches && ev.touches.length)){
			resetPress();
			return;
		}
		let x = ev.clientX || ev.touches[0] && ev.touches[0].clientX;
		let y = ev.clientY || ev.touches[0] && ev.touches[0].clientY;
		setPoint({ x, y });
		setDragDistance(Math.sqrt(
			(x - origin.x) * (x - origin.x) + (y - origin.y) * (y - origin.y)
		));
		setIsClicking( isClicking && dragDistance <= 4);
		setIsDragging( ev.touches && dragDistance > 4);
		if(props.setIsDragging) props.setIsDragging(isDragging);
		setIsDiscarding( ev.touches && y - origin.y > 40);
	}

	let stopPress = function(ev){
		if(isClicking && ! ev.touches) props.showAnswer();
		if(isDiscarding) props.resetBoard();
		resetPress();
	}

	let resetPress = function(){
		setIsDiscarding(false);
		setIsClicking(false);
		setIsDragging(false);
		if(props.setIsDragging) props.setIsDragging(false);
		setIsPressed(false);
	}

	let toKey = (x, y) => x + "/" + y;

	let cellProps = [];
	let cellPropDic = {};
	for(let i = 0; i < height; i ++){
		for(let j = 0; j < width; j ++){
			let key = toKey(i, j);
			let cellProp = {
				isGoal: false,
				x: i,
				y: j,
				key: key
			};
			if(i == 0) cellProp.wallXBack = true;
			if(i == height - 1) cellProp.wallX = true;
			if(j == 0) cellProp.wallYBack = true;
			if(j == width - 1) cellProp.wallY = true;
			cellProps.push(cellProp);
			cellPropDic[key] = cellProp;
		}
	}
	for(let wall of props.walls || []){
		let x = wall.x, y = wall.y;
		if(wall.type == 1 || wall.type == 2){
			cellPropDic[toKey(x, y)].wallXBack = true;
			if(x > 0) cellPropDic[toKey(x - 1, y)].wallX = true;
		}
		if(wall.type == 3 || wall.type == 4){
			cellPropDic[toKey(x, y)].wallX = true;
			if(x < height - 1) cellPropDic[toKey(x + 1, y)].wallXBack = true;
		}
		if(wall.type == 1 || wall.type == 3){
			cellPropDic[toKey(x, y)].wallYBack = true;
			if(y > 0) cellPropDic[toKey(x, y - 1)].wallY = true;
		}
		if(wall.type == 2 || wall.type == 4){
			cellPropDic[toKey(x, y)].wallY = true;
			if(y < width - 1) cellPropDic[toKey(x, y + 1)].wallYBack = true;
		}
		if(wall.isGoal) cellPropDic[toKey(x, y)].isGoal = true;
		if(wall.isShade) cellPropDic[toKey(x, y)].isShade = true;
	}

	let robotProps = props.robots || [];
	let nRobot = robotProps.length;

	let lines = props.lines || [];
	let lineRows = [], lineColumns = [];
	let lineRoutes = [];
	for(let x = 0; x < height; x ++) lineRows[x] = [];
	for(let y = 0; y < width; y ++) lineColumns[y] = [];
	for(let i = 0; i < nRobot; i ++) lineRoutes[i] = [];
	for(let line of lines){
		if(line.sx == line.tx) lineRows[line.sx].push(line), line.isWidthSide = true;
		if(line.sy == line.ty) lineColumns[line.sy].push(line), line.isHeightSide = true;
		lineRoutes[line.iRobot].push(line);
		line.x1 = Math.min(line.sx, line.tx), line.x2 = Math.max(line.sx, line.tx);
		line.y1 = Math.min(line.sy, line.ty), line.y2 = Math.max(line.sy, line.ty);
	}

	let minilines = [];
	let minirobots = [];

	for(let lineRow of lineRows){
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
	for(let lineColumn of lineColumns){
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
	for(let rp of robotProps) rp.dx = 0, rp.dy = 0;
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
			if(l.isWidthSide && l1.isWidthSide){
				minilines.push({
					iRobot: l.iRobot, sx: l.tx, sy: l.ty, tx: l1.sx, ty: l1.sy, dx: 0, dy: 0,
					dsx: l.dx + (l.dx < l1.dx ? 0.5 : -0.5), dsy: 0,
					dtx: l1.dx + (l.dx < l1.dx ? -0.5 : 0.5), dty: 0,
					isHeightSide: true
				});
			}
			if(l.isHeightSide && l1.isHeightSide){
				minilines.push({
					iRobot: l.iRobot, sx: l.tx, sy: l.ty, tx: l1.sx, ty: l1.sy, dx: 0, dy: 0,
					dsx: 0, dsy: l.dy + (l.dy < l1.dy ? 0.5 : -0.5),
					dtx: 0, dty: l1.dy + (l.dy < l1.dy ? -0.5 : 0.5),
					isWidthSide: true
				});
			}
		}
		let l = lineRoute[0];
		if(l){
			if(l.isWidthSide) l.dsy = (l.sy < l.ty ? 2 : -2); else l.dsy = 0;
			if(l.isHeightSide) l.dsx = (l.sx < l.tx ? 2 : -2); else l.dsx = 0;
			robotProps[l.iRobot].dx = (l.dx || 0);
			robotProps[l.iRobot].dy = (l.dy || 0);
		}
		l = lineRoute[lineRoute.length - 1];
		if(l){
			if(l.isWidthSide) l.dty = (l.sy < l.ty ? -2 : 2); else l.dty = 0;
			if(l.isHeightSide) l.dtx = (l.sx < l.tx ? -2 : 2); else l.dtx = 0;
			minirobots.push({
				iRobot: l.iRobot,
				x: l.tx, y: l.ty,
				dx: (l.dx || 0) + l.dtx * 0.5, dy: (l.dy || 0) + l.dty * 0.5,
				isMain: (l.iRobot == 0)
			});
		}
	}

	return <div className={"board" +
		(props.isLoading ? " loading" : "") + 
		(isPressed ? " pressed" : "") + 
		(isDragging ? " dragging" : "") + 
		(props.isBack ? " back" : "")
		}
		style={{
			top: (isDragging && point.y > origin.y ? point.y - origin.y : 0),
		}}
		onMouseDown={startPress}
		onMouseUp={stopPress}
		onMouseLeave={stopPress}
		onTouchStart={startPress}
		onTouchEnd={stopPress}
		onMouseMove={movePress}
		onTouchMove={movePress}
		>
		{ robotProps.map(_ => <Robot
			key={_.key} x={_.x} y={_.y} isMain={_.isMain}
			number={props.showsNumber && _.key > 1 ? (_.key - 1) : null}
			dx={props.showsRoute ? _.dx : 0} dy={props.showsRoute ? _.dy : 0}
		/>) }
		{ cellProps.map(_ =>
			<Cell key={_.x+"/"+_.y} x={_.x} y={_.y} isShade={_.isShade}
				wallX={_.wallX} wallXBack={_.wallXBack}
				wallY={_.wallY} wallYBack={_.wallYBack} isGoal={_.isGoal}
			/>
		)}
		{ props.showsRoute && props.lines && props.lines.map((_, i) =>
			<TraceLine key={i} i={_.iRobot} sx={_.sx} sy={_.sy} tx={_.tx} ty={_.ty}
				dx={_.dx} dy={_.dy} dsx={_.dsx} dsy={_.dsy} dtx={_.dtx} dty={_.dty}
				isWidthSide={_.isWidthSide} isHeightSide={_.isHeightSide}
			/>
		)}
		{ props.showsRoute && minilines && minilines.map((_, i) =>
			<TraceLine key={i} i={_.iRobot} sx={_.sx} sy={_.sy} tx={_.tx} ty={_.ty}
				dx={_.dx} dy={_.dy} dsx={_.dsx} dsy={_.dsy} dtx={_.dtx} dty={_.dty}
				isWidthSide={_.isWidthSide} isHeightSide={_.isHeightSide}
			/>
		)}
		{ props.showsRoute && minirobots && minirobots.map((_, i) =>
			<MiniRobot key={i} i={_.iRobot} x={_.x} y={_.y} dx={_.dx} dy={_.dy}
				isMain={_.isMain}
			/>
		)}
		{ props.isLoading ? <div className="loading-message">
		</div> : null }
		{ isDiscarding ? <div className="discarding">
			<span className="material-icons">delete_forever</span>
		</div> : null }
	</div>
}
let WallX = function(props){
	return <div className="wall wall-x" />
}
let WallXBack = function(props){
	return <div className="wall wall-x wall-back" />
}
let WallY = function(props){
	return <div className="wall wall-y" />
}
let WallYBack = function(props){
	return <div className="wall wall-y wall-back" />
}
let Goal = function(props){
	return <div className="goal" />
}
