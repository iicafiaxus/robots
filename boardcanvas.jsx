const BoardCanvas = function(props){
	const {
		width, height,
		colors,
		walls, robots, minirobots, routes,
		showsRoute,
		orientation = "normal",
	} = props;

	const scaleRate = Math.sqrt(Math.min(width / 8, height / 8));
	const cellSize = 100;
	const lineOffset = 10 * scaleRate;
	const lineWidth = 2 * scaleRate;

	// x, y 座標を正しいほうに変換 (robot や wall は長い方が x なので注意）
	const transpose = orientation == "transposed"
		? (x, y) => [x, y]
		: (x, y) => [y, x]
	;

	const ref = React.useRef(null);
	const [context, setContext] = React.useState(null);

	const [canvasWidth, canvasHeight] = transpose(
		height * cellSize + (height - 1) * 1 + 3 + 3,
		width * cellSize + (width - 1) * 1 + 3 + 3
	);
	const p = (i) => 3 + i * cellSize + (i - 1) * 1;
		// p(i) = i 番目のセルの左上の座標（ボーダーではなく中身の左上）

	const shadePatternCanvas = (() => {
		const canvas = new OffscreenCanvas(lineWidth * 16, lineWidth * 16);
		const context = canvas.getContext("2d");
		context.strokeStyle = colors.cellShade;
		context.lineWidth = lineWidth * 2;
		context.beginPath();
		for(let d = 0; d <= lineWidth * 32; d += lineWidth * 4){
			context.moveTo(lineWidth * -16 + d, lineWidth * 16 + d);
			context.lineTo(lineWidth * 16 + d, lineWidth * -16 + d);
		}
		context.stroke();
		return canvas;
	})();

	// 指定の座標が中心になるように文字を書く
	const fillTextInCenter = (x, y, text) => {
		const metrics = context.measureText(text);
		const width = metrics.width;
		const ascent = metrics.actualBoundingBoxAscent;
		const descent = metrics.actualBoundingBoxDescent;
		context.fillText(text, x - width / 2, y + ascent / 2);
	}

	React.useEffect(() => {
		if(!ref || !ref.current) return;
		if(!context) setContext(ref.current.getContext("2d"));
	});

	React.useEffect(() => {
		if(!context) return;

		context.lineCap = "round";

		// 背景
		context.fillStyle = colors.board;
		context.fillRect(0, 0, canvasWidth, canvasHeight);

		// 島の塗り込み
		for (let wall of walls) if (wall.isShade){
			const [x0, y0] = transpose(
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			);
			context.fillStyle = context.createPattern(shadePatternCanvas, "repeat");
			context.fillRect(x0, y0, cellSize, cellSize);
		}

		// ゴール
		for (let wall of walls) if (wall.isGoal){
			const [x0, y0] = transpose(
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			);
			context.fillStyle = colors.goal[wall.goalColor];
			context.fillRect(x0, y0, cellSize + lineWidth * 1, cellSize + lineWidth * 1);
		}

		// ゴール名
		for (let wall of walls) if (wall.isGoal){
			const [x, y] = transpose(
				p(wall.x) + cellSize / 2,
				p(wall.y) + cellSize / 2
			);
			context.fillStyle = colors.goalText;
			context.font = `${cellSize * 0.35}px sans-serif`;
			fillTextInCenter(x, y, wall.goalName);
		}

		// セルの線
		context.strokeStyle = colors.cell;
		context.lineWidth = lineWidth * 1;
		context.beginPath();
		const [iCount, jCount] = transpose(width, height);
		for (let i = 1; i < iCount; i ++) {
			const [x0, y0] = [p(0) - lineWidth * 1, p(i) - lineWidth * 1];
			context.moveTo(x0, y0);
			const [x1, y1] = [p(jCount) - lineWidth * 1, p(i) - lineWidth * 1];
			context.lineTo(x1, y1);
		}
		for (let j = 1; j < jCount; j ++) {
			const [x0, y0] = [p(j) - lineWidth * 1, p(0) - lineWidth * 1];
			context.moveTo(x0, y0);
			const [x1, y1] = [p(j) - lineWidth * 1,p(iCount) - lineWidth * 1];
			context.lineTo(x1, y1);
		}
		context.stroke();

		// 島の線
		for (let wall of walls) if (wall.isShade){
			const [x0, y0] = transpose(
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			);
			context.strokeStyle = colors.cellShadeBorder;
			context.lineWidth = lineWidth * 1;
			context.strokeRect(x0, y0, cellSize + lineWidth * 1, cellSize + lineWidth * 1);
		}

		// 外周
		context.strokeStyle = colors.wall;
		context.lineWidth = lineWidth * 4;
		context.strokeRect(
			lineWidth * 2, lineWidth * 2, canvasWidth - lineWidth * 4 + 1, canvasHeight - lineWidth * 4 + 1);

		// 壁
		context.strokeStyle = colors.wall;
		context.lineWidth = lineWidth * 3;
		context.beginPath();
		const makeWall = ([x0, y0], [x1, y1]) => {
			context.moveTo(x0, y0);
			context.lineTo(x1, y1);
		};
		for (let wall of walls) {
			const [x0, y0] = transpose(
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			);
			const [x1, y1] = [
				x0 + cellSize + lineWidth * 1,
				y0 + cellSize + lineWidth * 1
			];
			const [p0, [p1, p2], p3] = [[x0, y0], transpose([x0, y1], [x1, y0]), [x1, y1]];
			if (wall.type == 1 || wall.type == 2) makeWall(p0, p1);
			if (wall.type == 3 || wall.type == 4) makeWall(p2, p3);
			if (wall.type == 1 || wall.type == 3) makeWall(p0, p2);
			if (wall.type == 2 || wall.type == 4) makeWall(p1, p3);
		}
		context.stroke();

		// ロボット
		for (let robot of robots){
			const [x, y] = transpose(
				p(robot.x) + cellSize / 2 + lineOffset * (showsRoute ? robot.dx : 0),
				p(robot.y) + cellSize / 2 + lineOffset * (showsRoute ? robot.dy : 0)
			);
			
			context.fillStyle = colors.robot[robot.key];
			context.beginPath();
			context.arc(x, y, cellSize * 0.35, 0, Math.PI * 2);
			context.fill();

			context.fillStyle = colors.robotText;
			context.font = `${cellSize * 0.5}px sans-serif`;
			fillTextInCenter(x, y, robot.name);
		}

		// 小ロボット
		if (showsRoute) for (let robot of minirobots){
			const [x, y] = transpose(
				p(robot.x) + cellSize / 2 + lineOffset * robot.dx,
				p(robot.y) + cellSize / 2 + lineOffset * robot.dy
			);

			context.fillStyle = colors.minirobot[robot.key];
			context.beginPath();
			context.arc(x, y, cellSize * 0.1, 0, Math.PI * 2);
			context.fill();
		}

		// ライン
		const calcLine = (line) => {
			const [dsx, dsy] = [
				isNaN(line.dx) ? line.dsx || 0 : line.dx,
				isNaN(line.dy) ? line.dsy || 0 : line.dy
			];
			const [dtx, dty] = [
				isNaN(line.dx) ? line.dtx || 0 : line.dx,
				isNaN(line.dy) ? line.dty || 0 : line.dy
			];

			const [x0, y0] = transpose(
				p(line.sx) + cellSize / 2 + lineOffset * dsx,
				p(line.sy) + cellSize / 2 + lineOffset * dsy
			);
			const [x1, y1] = transpose(
				p(line.tx) + cellSize / 2 + lineOffset * dtx,
				p(line.ty) + cellSize / 2 + lineOffset * dty
			);

			return [x0, y0, x1, y1];
		}
		if (showsRoute) for (let route of routes){
			if ( ! route.lines.length) continue;
			context.strokeStyle = colors.line[route.key];
			context.lineWidth = lineWidth * 3;
			context.beginPath();
			const [x0, y0, x1, y1] = calcLine(route.lines[0]);
			context.moveTo(x0, y0);
			context.lineTo(x1, y1);
			for (let line of route.lines.slice(1)){
				const [x0, y0, x1, y1] = calcLine(line);
				context.lineTo(x0, y0);
				context.lineTo(x1, y1);
			}
			context.stroke();
		}

	});

	return <canvas ref={ref} width={canvasWidth} height={canvasHeight} />;
};