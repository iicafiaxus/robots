const sprites = function(){
	const sprites = {};
	const loadSprite = (name, fileName, u0, v0, uSize, vSize, uOffset, vOffset) => {
		const image = new Image();
		image.onload = () => {
			const canvas = new OffscreenCanvas(uSize, vSize);
			const context = canvas.getContext("2d");
			context.drawImage(image, u0, v0, uSize, vSize, 0, 0, uSize, vSize);
			sprites[name] = { image: canvas, uOffset, vOffset, uSize, vSize };
		};
		console.log(`loading sprite ${name} from ${fileName}`);
		image.src = fileName;
	};
	loadSprite("floor", "images/floor.png", 0, 0, 832, 832, 416, 416);
	/*
	loadSprite("robot_1", "images/robots_old.png", 0, 0, 448, 592, 232, 482);
	loadSprite("robot_2", "images/robots_old.png", 448, 0, 448, 578, 228, 462);
	loadSprite("robot_3", "images/robots_old.png", 0, 592, 448, 624, 232, 500);
	loadSprite("robot_4", "images/robots_old.png", 448, 592, 448, 624, 240, 500);
	*/
	/*
	loadSprite("robot_1", "images/robot_1.png", 0, 0, 832, 832, 416, 620);
	loadSprite("robot_2", "images/robot_2.png", 0, 0, 832, 832, 416, 620);
	loadSprite("robot_3", "images/robot_3.png", 0, 0, 832, 832, 416, 620);
	loadSprite("robot_4", "images/robot_4.png", 0, 0, 832, 832, 416, 620);
	*/
	loadSprite("robot_1", "images/robots.png", 280, 36, 256, 256, 128, 160);
	loadSprite("robot_2", "images/robots.png", 560, 48, 256, 256, 128, 160);
	loadSprite("robot_3", "images/robots.png", 280, 344, 256, 256, 128, 160);
	loadSprite("robot_4", "images/robots.png", 32, 128, 256, 256, 128, 160);

	loadSprite("flag_1", "images/flags.png", 572, 32, 160, 352, 150, 340);
	loadSprite("flag_2", "images/flags.png", 32, 32, 160, 352, 150, 340);
	loadSprite("flag_3", "images/flags.png", 0, 592, 448, 624, 232, 500);
	loadSprite("flag_4", "images/flags.png", 448, 592, 448, 624, 240, 500);

	return sprites;
}();

const BoardCanvas3d = function(props){
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
	const d = (x, y) => transpose(x, y)[1]; // 表示順に寄与する成分

	const p = (i) => 3 + i * cellSize + (i - 1) * 0;
		// p(i) = i 番目のセルの左上の座標（ボーダーではなく中身の左上）
	const [iCount, jCount] = [width, height];

	// 座標変換
	const cos = 0.7, sin = Math.sqrt(1 - cos * cos);
	const [xMax, yMax] = transpose(
		height * cellSize + (height - 1) * 1 + 3 + 3,
		width * cellSize + (width - 1) * 1 + 3 + 3
	);
	const zMax = cellSize * 1.5;
	const project = ([x, y, z = 0]) => {
		const [xt, yt] = rotate(x, y), zt = z;
		//if( ! is3d) return [xt, yt, 0];
		const uh = xt;
		const vh = (yMax - yt) * cos + zt * sin;
		const depth = (yMax - yt) * sin - zt * cos;;
		return [uh, canvasHeight - vh, depth];
	}
	const [canvasWidth, canvasHeight] = [xMax, yMax * cos + zMax * sin];

	const ref = React.useRef(null);
	const [context, setContext] = React.useState(null);

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

	// 描画を予約する
	const addItem = (depth, draw) => {
		items.push({ depth, draw });
	}
	const drawName = (point, size, color, text) => {
		const [u, v] = project(point);
		context.fillStyle = color;
		context.font = `${size}px sans-serif`;
		fillTextInCenter(u, v, text);
	};
	const drawBox = (p0, p1, color, lineWidth) => {
		const [u0, v0] = project(p0);
		const [u1, v1] = project(p1);
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.strokeRect(u0, v0, u1 - u0, v1 - v0);
	};
	const fillBox = (p0, p1, color) => {
		const [u0, v0] = project(p0);
		const [u1, v1] = project(p1);
		context.fillStyle = color;
		context.fillRect(u0, v0, u1 - u0, v1 - v0);
	};
	const drawLine = (p0, p1, color, lineWidth) => {
		const [u0, v0] = project(p0);
		const [u1, v1] = project(p1);
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.lineCap = "round";
		context.beginPath();
		context.moveTo(u0, v0);
		context.lineTo(u1, v1);
		context.stroke();
	};
	const drawLines = (points, color, lineWidth) => {
		if(points.length == 0) return;
		
		/*
		for (let i = 0; i < points.length - 1; i ++){
			drawLine(points[i], points[i + 1], color, lineWidth); 
		}
		*/
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
	const putSprite = (point, size, sprite) => {
		if( ! sprite) return;
		const [u, v] = project(point);
		const ratio = size / Math.max(sprite.uSize, sprite.vSize);
		context.drawImage(
			sprite.image,
			u - sprite.uOffset * ratio, v - sprite.vOffset * ratio,
			sprite.uSize * ratio, sprite.vSize * ratio
		);
	}
	const putSpriteBox = (p0, p1, sprite) => {
		if( ! sprite) return;
		const [u0, v0] = project(p0);
		const [u1, v1] = project(p1);
		context.drawImage(sprite.image, u0, v0, u1 - u0, v1 - v0);
	}

	// 深さ順に描画する
	const items = [];
	const drawAll = () => {
		items.sort((a, b) => a.depth - b.depth); // depth が小さいものから描画する
		for(let item of items){
			item.draw();
		}
	};

	// 表示設定
	const wallHeight = cellSize * 0.25;

	React.useEffect(() => {
		if(!ref || !ref.current) return;
		if(!context) setContext(ref.current.getContext("2d"));
	});

	React.useEffect(() => {
		if(!context) return;

		context.lineCap = "round";

	}, [context]);

	React.useEffect(() => {
		if(!context) return;

		items.length = 0;

		// 背景
		context.fillStyle = colors.board;
		context.fillRect(0, 0, canvasWidth, canvasHeight);

		// 床
		for (let i = 0; i < iCount; i ++) for (let j = 0; j < jCount; j ++){
			const [x0, y0] = [p(j) - lineWidth * 0, p(i) - lineWidth * 0];
			const [x1, y1] = [p(j) + cellSize + lineWidth * 0, p(i) + cellSize + lineWidth * 0];
			addItem(10 * d(j, i) + 0, () => 
				putSpriteBox([x0, y0], [x1, y1], sprites.floor)
			);
		}

		// 島の塗り込み
		for (let wall of walls) if (wall.isShade){
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [x0 + cellSize, y0 + cellSize];
			addItem(10000 + 100 * d(wall.x, wall.y) + 31, () => 
				fillBox(
					[x0, y0, wallHeight],
					[x1, y1, wallHeight],
					context.createPattern(shadePatternCanvas, "repeat")
				)
			);
		}

		// ゴール
		for (let wall of walls) if (wall.isGoal){
			const [x, y] = [p(wall.x) + cellSize / 2, p(wall.y) + cellSize / 2];
			addItem(10000 + 100 * d(wall.x, wall.y) + 2, () => 
				putSprite([x, y, 0], cellSize * 1.3, sprites["flag_" + wall.goalColor])
			);
		}

		// ゴール名
		for (let wall of walls) if (wall.isGoal){
			const [x, y] = [
				p(wall.x) + cellSize / 2,
				p(wall.y) + cellSize / 2
			];
			addItem(10000 + 100 * d(wall.x, wall.y) + 3, () => 
				drawName([x, y, cellSize * 0.13], cellSize * 0.35, colors.goalText, wall.goalName)
			);
		}

		// 島の線
		for (let wall of walls) if (wall.isShade){
			const [x0, y0] = [
				p(wall.x) - lineWidth * 1,
				p(wall.y) - lineWidth * 1
			];
			const [x1, y1] = [x0 + cellSize + lineWidth * 1, y0 + cellSize + lineWidth * 1];
			addItem(10000 + 100 * d(wall.x, wall.y) + 1, () => 
				drawBox(
					[x0, y0, wallHeight],
					[x1, y1, wallHeight],
					colors.cellShadeBorder, lineWidth * 1
				)
			);
		}

		// 壁
		const drawWall = ([x0, y0], [x1, y1]) => {
			fillBox(
				[x0 - lineWidth * 3, y0 - lineWidth * 3, wallHeight],
				[x1 + lineWidth * 3, y1 + lineWidth * 3, 0],
				"#c84c"
			);
			//drawLine([x0, y0, cellSize * 0.1], [x1, y1, cellSize * 0.1], colors.wall, lineWidth * 3);
			fillBox(
				[x0 - lineWidth * 3, y0 - lineWidth * 3, wallHeight],
				[x1 + lineWidth * 3, y1 + lineWidth * 3, wallHeight],
				colors.wall
			);
		};
		for (let wall of walls) {
			const [x0, y0] = [p(wall.x), p(wall.y)];
			const [x1, y1] = [x0 + cellSize, y0 + cellSize];
			const [p0, p1, p2, p3] = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]];
			const base = 10000 + 100 * d(wall.x, wall.y);
			if (wall.type == 1 || wall.type == 2) addItem(base + d(1, 10), () => drawWall(p0, p1));
			if (wall.type == 3 || wall.type == 4) addItem(base + d(10, 30), () => drawWall(p2, p3));
			if (wall.type == 1 || wall.type == 3) addItem(base + d(10, 1), () => drawWall(p0, p2));
			if (wall.type == 2 || wall.type == 4) addItem(base + d(30, 10), () => drawWall(p1, p3));
		}

		// 外周
		/*
		drawBox(
			[lineWidth * 2, lineWidth * 2], 
			[p(height) - lineWidth * 2 + 1 + 3, p(width) - lineWidth * 2 + 1 + 3],
			colors.wall, lineWidth * 4
		);
		*/
		for (let i = 0; i < iCount; i ++) {
			const [x0, y0] = [p(0), p(i)];
			const [x1, y1] = [p(0), p(i + 1)];
			addItem(10000 + 100 * d(0, i) + d(1, 10), () => drawWall([x0, y0], [x1, y1]));
		}
		for (let i = 0; i < iCount; i ++) {
			const [x0, y0] = [p(jCount), p(i)];
			const [x1, y1] = [p(jCount), p(i + 1)];
			addItem(10000 + 100 * d(jCount, i) + d(10, 30), () => drawWall([x0, y0], [x1, y1]));
		}
		for (let j = 0; j < jCount; j ++) {
			const [x0, y0] = [p(j), p(0)];
			const [x1, y1] = [p(j + 1),p(0)];
			addItem(10000 + 100 * d(j, 0) + d(10, 1), () => drawWall([x0, y0], [x1, y1]));
		}
		for (let j = 0; j < jCount; j ++) {
			const [x0, y0] = [p(j), p(iCount)];
			const [x1, y1] = [p(j + 1),p(iCount)];
			addItem(10000 + 100 * d(j, iCount) + d(30, 10), () => drawWall([x0, y0], [x1, y1]));
		}

		// ロボット
		for (let robot of robots){
			const point = [
				p(robot.x) + cellSize / 2 + lineOffset * (showsRoute ? robot.dx : 0),
				p(robot.y) + cellSize / 2 + lineOffset * (showsRoute ? robot.dy : 0),
			];
			addItem(10000 + 100 * d(robot.x, robot.y) + 20, () => 
				putSprite(point, cellSize * 1.0, sprites["robot_" + robot.key])
			);
		}

		// 小ロボット
		if (showsRoute) for (let robot of minirobots){
			const [x, y] = [
				p(robot.x) + cellSize / 2 + lineOffset * robot.dx,
				p(robot.y) + cellSize / 2 + lineOffset * robot.dy
			];
			addItem(10000 + 100 * d(robot.x, robot.y) + 20, () => 
				fillCircle([x, y], cellSize * 0.1, colors.minirobot[robot.key])
			);
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
			addItem(900, () => drawRoute(lines, colors.line[route.key]));
		}

		drawAll();

	});

	return <canvas ref={ref} width={canvasWidth} height={canvasHeight} />;
};