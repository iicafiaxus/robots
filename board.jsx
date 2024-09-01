"REQUIRE boarditems.jsx";
"REQUIRE boardcanvas.jsx";

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
	
	const goalNames = (
		props.goalCount > 1 && props.showsGoalName
		? ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
		: ["", "", "", "", "", "", "", "", "", ""]
	);
	props.walls?.forEach(wall => {
		if(wall.isGoal) wall.goalName = goalNames[wall.goalColor || 0];
	})

	let robots = props.robots || [];

	const mainRobotNames = (
		props.showsNumber && props.goalCount > 1
		? ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
		: ["", "", "", "", "", "", "", "", ""]
	);
	const subRobotNames = (
		props.showsNumber
		? ["I", "A", "B", "C", "D", "E", "F", "G", "H"]
		: ["", "", "", "", "", "", "", "", ""]
	);
	robots.forEach((robot, i) => {
		if(robot.isMain) robot.name = mainRobotNames[i];
		else robot.name = subRobotNames[i];
	})

	let lines = props.lines || [];

	let lineRoutes = robots.map(_ => []);
	for(let line of lines) lineRoutes[line.iRobot].push(line);

	let lineRows = [], lineColumns = [];
	for(let x = 0; x < height; x ++) lineRows[x] = [];
	for(let y = 0; y < width; y ++) lineColumns[y] = [];
	for(let line of lines){
		if(line.sx == line.tx) lineRows[line.sx].push(line), line.isWidthSide = true;
		if(line.sy == line.ty) lineColumns[line.sy].push(line), line.isHeightSide = true;
		line.x1 = Math.min(line.sx, line.tx), line.x2 = Math.max(line.sx, line.tx);
		line.y1 = Math.min(line.sy, line.ty), line.y2 = Math.max(line.sy, line.ty);
	}

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
				isMain: (l.iRobot < props.goalCount)
			});
		}
	}

	let dragAmount = isDragging && point.y > origin.y ? point.y - origin.y : 0;

	const colors = {
		board: "#fff",
		wall: "#850",
		cell: "#eee",
		cellShade: "#8509",
		cellShadeBorder: "#c949",
		goalText: "#0004",
		robot: (
			props.useColorful
			? ["#eeef", "#e05f", "#03ef", "#0a2f", "#db0f"]
			: [0, 1, 2, 3, 4].map(i => i <= props.goalCount ? "#e05f" : "#ab4f")
		),
		robotText: "#fffc",
		goal: (
			props.useColorful
			? ["#eeef", "#e054", "#03e4", "#0a26", "#db08"]
			: [0, 1, 2, 3, 4].map(i => i <= props.goalCount ? "#e054" : "#ab48")
		),
		minirobot: (
			props.useColorful
			? ["#eeef", "#e05f", "#03ef", "#0a2f", "#db0f"]
			: [0, 1, 2, 3, 4].map(i => i <= props.goalCount ? "#e05f" : "#ab4f")
		),
		line: (
			props.useColorful
			? ["#eeef", "#e054", "#03e4", "#0a26", "#db08"]
			: [0, 1, 2, 3, 4].map(i => i <= props.goalCount ? "#e054" : "#ab48")
		),
	};
	
	return <div
		className={[
			"board",
			(props.isLoading ? "loading" : ""),
			(isPressed ? "pressed" : ""),
			(isDragging ? "dragging" : ""),
			(props.isBack ? "back" : "")
		].join(" ").replaceAll(/ +/g, " ")}
		style={{ top: dragAmount }}
		onMouseDown={startPress}
		onMouseUp={stopPress}
		onMouseLeave={stopPress}
		onTouchStart={startPress}
		onTouchEnd={stopPress}
		onMouseMove={movePress}
		onTouchMove={movePress}
	>

		<BoardCanvas
			width={width} height={height}
			colors={colors}
			walls={props.walls}
			robots={robots}
			minirobots={minirobots}
			routes={lineRoutes.map((x, i) => ({ key: i + 1, lines: x }))}
			showsRoute={props.showsRoute}
			orientation={
				["board-landscape", "screen-landscape"].includes(props.layoutName)
				? "transposed"
				: "default"
			}
		/>

		{ props.isLoading ? <div className="loading-message"></div> : null }
		{ isDiscarding ? <div className="discarding discarding-back"></div> : null }
		{ isDiscarding ?
			<div className="discarding discarding-message">
				<span className="material-icons">delete_forever</span>
			</div>
			: null
		}
		
	</div>
}
