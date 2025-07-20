"REQUIRE boardutil.js";
"REQUIRE boardcanvas.jsx";
"REQUIRE boardcanvas3d.jsx";

let Board = function(props){
	let isContest = props.isContest;
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
		if(isContest) return;
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
	let [lineRoutes, minirobots] = boardUtil.calc(robots, lines, { showAllMinis: isContest });

	let dragAmount = isDragging && point.y > origin.y ? point.y - origin.y : 0;

	const colors = {
		board: "#fff",
		wall: isContest ? "#379" : "#850",
		cell: "#eee",
		cellShade: isContest ? "#3799" : "#8509",
		cellShadeBorder: isContest ? "#3795" : "#c949",
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

	const orientation = (
		["board-landscape", "screen-landscape"].includes(props.layoutName)
		? "transposed"
		: "default"
	);
	const canvasProps = {
		width, height, colors,
		walls: props.walls,
		robots, minirobots: isContest ? [] : minirobots,
		routes: lineRoutes.map((x, i) => ({ key: i + 1, lines: x })),
		showsRoute: isContest || props.showsRoute,
		orientation,
		textAngle: props.textAngle,
		isTrace: isContest,
	};

	return <div
		className={[
			"board",
			(props.isLoading ? "loading" : ""),
			(isPressed ? "pressed" : ""),
			(isDragging ? "dragging" : ""),
			(props.isBack ? "back" : ""),
			(isContest ? "contest" : "")
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

		{props.is3d
			? <BoardCanvas3d {...canvasProps} />
			: <BoardCanvas {...canvasProps} />
		}

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
