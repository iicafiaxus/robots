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
		{ props.isGoal ? <Goal color={props.goalColor} /> : null }
	</div>
}

let Robot = function(props){
	let du = 6;
	return <div
		className={[
			"robot",
			props.isMain ? "main" : "",
			props.color ? "color" + props.color : "",
		].join(" ")}
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
		className={[
			"robot",
			"minirobot",
			props.isMain ? "main" : "",
			props.color ? "color" + props.color : "",
		].join(" ")}
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
		className={[
			"trace",
			props.i == "0" ? "main" : "",
			props.color ? "color" + props.color : "",
		].join(" ")}
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
	return <div className={"goal" + " color" + props.color} />
}
