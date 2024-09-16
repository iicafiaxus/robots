const BoardCanvas = function(props){
	const {
		width, height,
		colors,
		walls, robots, minirobots, routes,
		showsRoute,
		orientation = "normal",
		is3d = false,
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
	const rotate = orientation == "transposed"
		? (x, y) => [canvasWidth - x, y]
		: (x, y) => [y, x]
	;
	const project = ([x, y, z = 0]) => {
		const [u, v] = rotate(x, y);
		return [u, v];
	}

	const ref = React.useRef(null);
	const [context, setContext] = React.useState(null);

	const [canvasWidth, canvasHeight] = transpose(
		height * cellSize + (height - 1) * 1 + 3 + 3,
		width * cellSize + (width - 1) * 1 + 3 + 3
	);
	const p = (i) => 3 + i * cellSize + (i - 1) * 1;
		// p(i) = i 番目のセルの左上の座標（ボーダーではなく中身の左上）

	// 斜線部
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
	const fillTextInCenter = (u, v, text) => {
		const metrics = context.measureText(text);
		const width = metrics.width;
		const ascent = metrics.actualBoundingBoxAscent;
		const descent = metrics.actualBoundingBoxDescent;
		context.fillText(text, u - width / 2, v + ascent / 2);
	}
	const drawName = (point, size, color, text) => {
		const [u, v] = project(point);
		context.fillStyle = color;
		context.font = `${size}px sans-serif`;
		fillTextInCenter(u, v, text);
	};

	const drawBox = (p0, p1, color, lineWidth) => {
		const [u0, v0] = project(p0), [u1, v1] = project(p1);
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.strokeRect(u0, v0, u1 - u0, v1 - v0);
	};
	const fillBox = (p0, p1, color) => {
		const [u0, v0] = project(p0), [u1, v1] = project(p1);
		context.fillStyle = color;
		context.fillRect(u0, v0, u1 - u0, v1 - v0);
	};
	const drawLine = (p0, p1, color, lineWidth) => {
		const [u0, v0] = project(p0), [u1, v1] = project(p1);
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.beginPath();
		context.moveTo(u0, v0);
		context.lineTo(u1, v1);
		context.stroke();
	};
	const drawLines = (points, color, lineWidth) => {
		if(points.length == 0) return;
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.beginPath();
		const [u0, v0] = project(points[0]);
		context.moveTo(u0, v0);
		for (let point of points.slice(1)){
			const [u, v] = project(point);
			context.lineTo(u, v);
		}
		context.stroke();
	}
	const fillCircle = (point, radius, color) => {
		const [u, v] = project(point);
		context.fillStyle = color;
		context.beginPath();
		context.arc(u, v, radius, 0, Math.PI * 2);
		context.fill();
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
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [x0 + cellSize, y0 + cellSize];
			fillBox([x0, y0], [x1, y1], context.createPattern(shadePatternCanvas, "repeat"));
		}

		// ゴール
		for (let wall of walls) if (wall.isGoal){
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [x0 + cellSize + lineWidth * 1, y0 + cellSize + lineWidth * 1];
			fillBox([x0, y0], [x1, y1], colors.goal[wall.goalColor]);
		}

		// ゴール名
		for (let wall of walls) if (wall.isGoal){
			const [x, y] = [
				p(wall.x) + cellSize / 2,
				p(wall.y) + cellSize / 2
			];
			drawName([x, y], cellSize * 0.35, colors.goalText, wall.goalName);
		}

		// セルの線
		const [iCount, jCount] = [width, height];
		for (let i = 1; i < iCount; i ++) {
			const [x0, y0] = [p(0) - lineWidth * 1, p(i) - lineWidth * 1];
			const [x1, y1] = [p(jCount) - lineWidth * 1, p(i) - lineWidth * 1];
			drawLine([x0, y0], [x1, y1], colors.cell, lineWidth * 1);
		}
		for (let j = 1; j < jCount; j ++) {
			const [x0, y0] = [p(j) - lineWidth * 1, p(0) - lineWidth * 1];
			const [x1, y1] = [p(j) - lineWidth * 1,p(iCount) - lineWidth * 1];
			drawLine([x0, y0], [x1, y1], colors.cell, lineWidth * 1);
		}

		// 島の線
		for (let wall of walls) if (wall.isShade){
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [x0 + cellSize + lineWidth * 1, y0 + cellSize + lineWidth * 1];
			drawBox([x0, y0], [x1, y1], colors.cellShadeBorder, lineWidth * 1);
		}

		// 外周
		drawBox(
			[lineWidth * 2, lineWidth * 2], 
			[p(height) - lineWidth * 2 + 1 + 3, p(width) - lineWidth * 2 + 1 + 3],
			colors.wall, lineWidth * 4
		);

		// 壁
		const drawWall = (p0, p1) => {
			drawLine(p0, p1, colors.wall, lineWidth * 3);
		};
		for (let wall of walls) {
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [
				x0 + cellSize + lineWidth * 1,
				y0 + cellSize + lineWidth * 1
			];
			const [p0, p1, p2, p3] = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]];
			if (wall.type == 1 || wall.type == 2) drawWall(p0, p1);
			if (wall.type == 3 || wall.type == 4) drawWall(p2, p3);
			if (wall.type == 1 || wall.type == 3) drawWall(p0, p2);
			if (wall.type == 2 || wall.type == 4) drawWall(p1, p3);
		}

		// ロボット
		for (let robot of robots){
			const [x, y] = [
				p(robot.x) + cellSize / 2 + lineOffset * (showsRoute ? robot.dx : 0),
				p(robot.y) + cellSize / 2 + lineOffset * (showsRoute ? robot.dy : 0)
			];
			fillCircle([x, y], cellSize * 0.35, colors.robot[robot.key]);
			drawName([x, y], cellSize * 0.5, colors.robotText, robot.name);
		}

		// 小ロボット
		if (showsRoute) for (let robot of minirobots){
			const [x, y] = [
				p(robot.x) + cellSize / 2 + lineOffset * robot.dx,
				p(robot.y) + cellSize / 2 + lineOffset * robot.dy
			];
			fillCircle([x, y], cellSize * 0.1, colors.minirobot[robot.key]);
		}

		// ライン
		const drawRoute = (lines, color) => {
			const points = [];
			for (let [x0, y0, x1, y1] of lines){
				points.push([x0, y0]);
				points.push([x1, y1]);
			}
			drawLines(points, color, lineWidth * 3);
		}
		const calcLine = (line) => {
			const [dsx, dsy] = [
				isNaN(line.dx) ? line.dsx || 0 : line.dx,
				isNaN(line.dy) ? line.dsy || 0 : line.dy
			];
			const [dtx, dty] = [
				isNaN(line.dx) ? line.dtx || 0 : line.dx,
				isNaN(line.dy) ? line.dty || 0 : line.dy
			];

			const [x0, y0] = [
				p(line.sx) + cellSize / 2 + lineOffset * dsx,
				p(line.sy) + cellSize / 2 + lineOffset * dsy
			];
			const [x1, y1] = [
				p(line.tx) + cellSize / 2 + lineOffset * dtx,
				p(line.ty) + cellSize / 2 + lineOffset * dty
			];

			return [x0, y0, x1, y1];
		}
		if (showsRoute) for (let route of routes){
			if ( ! route.lines.length) continue;
			const lines = route.lines.map(line => calcLine(line));
			drawRoute(lines, colors.line[route.key]);
		}

	});

	return <canvas ref={ref} width={canvasWidth} height={canvasHeight} />;
};