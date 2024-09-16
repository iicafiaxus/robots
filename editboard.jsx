let EditCell = function(props){
	return <div
		className={[
			"cell editcell",
			(props.disabled ? "disabled" : ""),
			(props.isSample ? "sample" : ""),
			(props.isGoal ? "edit-goal" : ""),
			(props.isShade ? "shade" : ""),
			(props.wallType ? "wall" + props.wallType : ""),
			(props.isSelected ? "selected" : ""),
			(props.robot ? "edit-robot" : ""),
		].join(" ")}
		style={props.isSample ? null : {
			gridRow: (props.x || 0) + 1,
			gridColumn: (props.y || 0) + 1
		}}
		onClick={props.onClick}
	>
		{props.robot || (props.isGoal ? ["", "⑴", "⑵", "⑶", "⑷", "⑸", "⑹", "⑺", "⑻", "⑼"][props.goalColor] : "　")}
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

	let names = ["I", "A", "B", "C", "D", "E", "F", "G", "H"];
	for(let wall of props.walls){
		let key = wall.x + "/" + wall.y;
		let cell = cells.find(c => c.key == key);
		if(cell){
			cell.defaultWallType = wall.type;
			cell.defaultIsGoal = wall.isGoal;
			cell.defaultIsShade = wall.isShade;
			cell.defaultGoalColor = wall.goalColor; // 1, 2, 3, 4, or null
			if(wall.goalColor) names[wall.goalColor - 1] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"][wall.goalColor - 1];
		}
	}
	for(let robot of props.robots){
		let key = robot.x + "/" + robot.y;
		let cell = cells.find(c => c.key == key);
		if(cell) cell.defaultRobotName = names[robot.key - 1];
	}

	for(let cell of cells){
		[cell.robotName, cell.setRobotName] = React.useState(cell.defaultRobotName);
		[cell.wallType, cell.setWallType] = React.useState(cell.defaultWallType);
		[cell.isGoal, cell.setIsGoal] = React.useState(cell.defaultIsGoal);
		[cell.isShade, cell.setIsShade] = React.useState(cell.defaultIsShade);
		[cell.goalColor, cell.setGoalColor] = React.useState(cell.defaultGoalColor);
	}

	let [selectedCell, setSelectedCell] = React.useState(void 0);
	let select = function(cell){
		if(cell && selectedCell && selectedCell.key === cell.key){
			setSelectedCell(void 0);
			return;
		}
		if(cell){
			if(cell.isShade) setSelectedCell(void 0);
			else setSelectedCell(cell);
		}
	}

	let rotateWall = function(cell){
		cell.setWallType([2, 0, 4, 1, 3][cell.wallType || 0] || 0); // 0: none, 1, 2, 3, 4
		setCounter(c => c + 1);
	}
	let handleCellClick = function(cell){
		if(cell.isShade) setSelectedCell(void 0);
		else if(cell.isGoal){
			if(selectedCell) setSelectedCell(void 0);
			else select(cell);
		}
		else if(selectedCell && selectedCell.robotName){
			cell.setRobotName(selectedCell.robotName);
			selectedCell.setRobotName(cell.robotName);
			setCounter(c => c + 1);
			setSelectedCell(void 0);
		}
		else if(cell.robotName){
			select(cell);
		}
		else if(selectedCell && selectedCell.isGoal){
			if(cell.wallType){
				cell.setIsGoal(selectedCell.isGoal), cell.setGoalColor(selectedCell.goalColor);
				selectedCell.setIsGoal(cell.isGoal), selectedCell.setGoalColor(cell.goalColor);
				setCounter(c => c + 1);
			}
			setSelectedCell(void 0);
		}
		else rotateWall(cell);
	}

	let [counter, setCounter] = React.useState(0);
	React.useEffect(() => {
		props.update(cells);
	}, [counter]);

	let cellSize = Math.min(24 * 16 / props.height, 28 * 16 / props.width);

	let orientation = (
		["board-landscape", "screen-landscape"].includes(props.layoutName)
		? "transposed"
		: "default"
	);
	let [xCount, yCount] = (orientation == "transposed") ? [props.width, props.height] : [props.height, props.width]

	return <div className="board-set">
		<div
			className="board editboard"
			style={{
				gridTemplateRows: `repeat(${xCount}, ${cellSize + "px"})`,
				gridTemplateColumns: `repeat(${yCount}, ${cellSize + "px"})`,
				lineHeight: `${(cellSize - 6) + "px"}`,
			}}
		>
			{cells.map(cell => {
				let [x, y] = (orientation == "transposed") ? [cell.y, yCount - 1 - cell.x] : [cell.x, cell.y];
				let wallType = (orientation == "transposed")
					? [0, 2, 4, 1, 3][cell.wallType]
					: [0, 1, 2, 3, 4][cell.wallType]
				return <EditCell
					key={cell.key} x={x} y={y}
					wallType={wallType} isGoal={cell.isGoal} isShade={cell.isShade} goalColor={cell.goalColor}
					robot={cell.robotName}
					isSelected={selectedCell && cell.key === selectedCell.key}
					onClick={() => handleCellClick(cell)}
				/>;
			})}
		</div>
	</div>
}
