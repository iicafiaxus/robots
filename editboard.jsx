let EditCell = function(props){
	return <div
		className={
			"cell editcell" +
			(props.disabled ? " disabled" : "") + 
			(props.isSample ? " sample" : "") +
			(props.isGoal ? " edit-goal" : "") +
			(props.isShade ? " shade" : "") + 
			(props.wallType ? " wall" + props.wallType : "") +
			(props.isSelected ? " selected" : "")
		}
		style={props.isSample ? null : {
			gridRow: (props.x || 0) + 1,
			gridColumn: (props.y || 0) + 1
		}}
		onClick={props.onClick}
	>
		{props.robot || (props.isGoal ? "☆" : "　")}
	</div>
}
let EditCellButton = function(props){
	return (
		<button onClick={() => props.setWallType(props.wallType)}
			className={props.disabled ? "disabled" : ""}>
			<EditCell isSample={true}
				key={"sample" + props.wallType} wallType={props.wallType}
			/>
		</button>
	);
}

let EditBoard = function(props){
	let cells = [];
	for(let x = 0; x < props.height; x ++){
		for(let y = 0; y < props.width; y ++){
			let cell = { x, y, key: x + "/" + y };
			cells.push(cell);
		}
	}
	
	for(let robot of props.robots){
		let key = robot.x + "/" + robot.y;
		let cell = cells.find(c => c.key == key);
		if(cell) cell.defaultRobotName = ["●", "A", "B", "C", "D", "E", "F", "G", "H"][robot.key - 1];
	}
	for(let wall of props.walls){
		let key = wall.x + "/" + wall.y;
		let cell = cells.find(c => c.key == key);
		if(cell){
			cell.defaultWallType = wall.type;
			cell.defaultIsGoal = wall.isGoal;
			cell.defaultIsShade = wall.isShade;
		}
	}

	for(let cell of cells){
		[cell.robotName, cell.setRobotName] = React.useState(cell.defaultRobotName);
		[cell.wallType, cell.setWallType] = React.useState(cell.defaultWallType);
		[cell.isGoal, cell.setIsGoal] = React.useState(cell.defaultIsGoal);
		[cell.isShade, cell.setIsShade] = React.useState(cell.defaultIsShade);
	}

	let [selectedCell, setSelectedCell] = React.useState(void 0);
	let setSelect = function(cell){
		if(cell && selectedCell && selectedCell.key === cell.key){
			setSelectedCell(void 0);
			return;
		}
		if(cell){
			if(cell.isShade) setSelectedCell(void 0);
			else setSelectedCell(cell);
		}
	}
	let setWallType = function(type){
		let cell = selectedCell;
		if(cell) cell.setWallType(type);
		setSelectedCell(void 0);
		setCounter(c => c + 1);
	}
	let setGoal = function(){
		let cell = selectedCell;
		for(let c of cells) c.setIsGoal(false);
		if(cell){
			cell.setIsGoal(true);
			setSelectedCell(void 0);
		}
		setCounter(c => c + 1);
	}
	let setRobot = function(number){
		let cell = selectedCell;
		let name = ["●", "A", "B", "C", "D", "E", "F", "G", "H"][number];
		if(cell){
			for(let c of cells) if(c.robotName === name) c.setRobotName(void 0);
			cell.setRobotName(name);
		}
		setSelectedCell(void 0);
		setCounter(c => c + 1);
	}

	let [counter, setCounter] = React.useState(0);
	React.useEffect(() => {
		props.update(cells);
	}, [counter]);

	let cellSize = Math.min(24 * 16 / props.height, 28 * 16 / props.width);
	return <div className="board-set">
		<div
			className={"board editboard size" + props.size}
			style={{/*
				gridTemplateRows: `repeat(${props.height}, ${cellSize + "px"})`,
				gridTemplateColumns: `repeat(${props.width}, ${cellSize + "px"})`,
				lineHeight: `${(cellSize - 6) + "px"}`,*/
			}}
		>
			{ cells.map(cell =>
				<EditCell
					key={cell.key} x={cell.x} y={cell.y}
					wallType={cell.wallType} isGoal={cell.isGoal} isShade={cell.isShade}
					robot={cell.robotName}
					isSelected={selectedCell && cell.key === selectedCell.key}
					onClick={() => setSelect(cell)}
				/>
			)}
		</div>
		<div className={"buttons" + (selectedCell ? "" : " disabled")}>
			<EditCellButton setWallType={setWallType} wallType={0}
			disabled={selectedCell && selectedCell.isGoal} />
			<EditCellButton setWallType={setWallType} wallType={2} />
			<EditCellButton setWallType={setWallType} wallType={4} />
			<EditCellButton setWallType={setWallType} wallType={3} />
			<EditCellButton setWallType={setWallType} wallType={1} />
		</div>
		<div className={"buttons" +
			(selectedCell && ! selectedCell.robotName && ! selectedCell.isGoal ?
			"" : " disabled")}>
			<button onClick={() => setRobot(0)}>●</button>
			<button onClick={() => setRobot(1)}>A</button>
			<button onClick={() => setRobot(2)}>B</button>
			<button onClick={() => setRobot(3)}>C</button>
			<button onClick={() => setGoal()}
			className={selectedCell &&
				(! selectedCell.wallType || selectedCell.isGoal || selectedCell.robotName) &&
					"disabled"}
			>☆</button>
		</div>
	</div>
}
