let decoder = new function(){
	this.decode = function(code){
		let temp = {};
		let result = { isError: false, message: "" };
		let usedKeyset = new Set();

		let kvs =("" +  code).replaceAll(/\s/g, "").split(";");
		if(kvs[0] != "v0"){
			result.isError = true;
			result.message = "unknown version: " + kvs[0];
			return result;
		}

		let checkKeySingle = (k) => {
			if(usedKeyset.has(k)){
				result.isError = true;
				result.message = "duplicated key: " + kv;
			}
		};
		let checkKeyExists = (k) => {
			if( ! usedKeyset.has(k)){
				result.isError = true;
				result.message = "key not found: " + kv;
			}
		};

		let toNumber = (s) => {
			s = "" + s;
			if(s.length != 1) return NaN;
			if(s >= "0" && s <= "9") return +s;
			if(s >= "A" && s <= "Z") return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(s) + 10;
		}
		let decodePoint = (s) => {
			s = "" + s;
			if(s.length != 2){
				result.isError = true;
				result.message = "illegal position (length not 2): " + s;
			}
			let x = toNumber(s.charAt(0)), y = toNumber(s.charAt(1));
			if(isNaN(x) || isNaN(y) || x >= temp.h || y > temp.w){
				result.isError = true;
				result.message = "illegal position (out of bound): " + s;
			}
			return { x, y };
		};
		let decodePoints = (s) => {
			s = "" + s;
			let ps = [];
			for(let i = 0; i < s.length; i += 2){
				ps.push(decodePoint(s.slice(i, i + 2)));
			}
			return ps;
		}
		let decodeWall = (d, ps) => {
			d = "" + d;
			let type = "93C6".indexOf(d) + 1;
			if(d.length != 1 || type == 0){
				result.isError = true;
				result.message = "illegal wall position: " + d + "," + ps;
			}
			let ws = [];
			for(let i = 0; i < ps.length; i += 2){
				let p = decodePoint(ps.slice(i, i + 2));
				ws.push({ type, x: p.x, y: p.y });
			}
			return ws;
		}

		for(let kv of kvs){
			if(kv == "") continue;

			let k = kv.charAt(0), v = kv.slice(1);
			
			if( ! k.match(/[a-z]/)){
				result.isError = true;
				result.message = "illegal description (no key): " + kv;
				return result;
			}

			if(k == "v"){
				checkKeySingle(k);
				if(result.isError) return result;
				usedKeyset.add(k);
			}
			else if(k == "z"){
				checkKeySingle(k);
				if(result.isError) return result;
				usedKeyset.add(k);

				if(v == "88,0") temp.sizeName = "small", temp.h = 8, temp.w = 8;
				else if(v == "C8,1") temp.sizeName = "medium", temp.h = 12, temp.w = 8, temp.hasCenter = true;
				else if(v == "EA,1") temp.sizeName = "large", temp.h = 14, temp.w = 10, temp.hasCenter = true;
				else if(v == "GC,1") temp.sizeName = "large2", temp.h = 16, temp.w = 12, temp.hasCenter = true;
				else if(v == "GG,1") temp.sizeName = "large3", temp.h = 16, temp.w = 16, temp.hasCenter = true;
				else{
					result.isError = true;
					result.message = "unknown board size: " + v;
					return result;
				}

				if(temp.hasCenter) temp.centerWalls = [
					{ x: temp.h / 2 - 1, y: temp.w / 2 - 1, type: 1, isShade: true },
					{ x: temp.h / 2 - 1, y: temp.w / 2, type: 2, isShade: true },
					{ x: temp.h / 2,  y: temp.w / 2 - 1, type: 3, isShade: true },
					{ x: temp.h / 2,  y: temp.w / 2, type: 4, isShade: true }
				];
				else temp.centerWalls = [];

			}
			else if(k == "r"){
				checkKeySingle(k);
				if(result.isError) return result;
				usedKeyset.add(k);

				let points = decodePoints(v);
				if(result.isError) return result;
				if(points.length != 1){
					result.isError = true;
					result.message = "too many main robots: " + kv;
					return result;
				}
				temp.mainRobot = { x: points[0].x, y: points[0].y, isMain: true, key: 0 };

			}
			else if(k == "q"){
				checkKeySingle(k);
				if(result.isError) return result;
				usedKeyset.add(k);

				let points = decodePoints(v);
				if(result.isError) return result;
				temp.otherRobots = points.map((p, i) => ({ x: p.x, y: p.y, key: i + 2 }));

			}
			else if(k == "g"){
				checkKeySingle(k);
				if(result.isError) return result;
				usedKeyset.add(k);

				let cols = v.split(",");
				if(cols.length != 2){
					result.isError = true;
					result.message = "illegal goal description: " + kv;
					return result;
				}

				let walls = decodeWall(cols[0], cols[1]);
				if(result.isError) return result;
				if(walls.length != 1){
					result.isError = true;
					result.message = "illegal goal description: " + kv;
					return result;
				}
				temp.goalWall = { ...walls[0], isGoal: true }
			}
			else if(k == "w"){
				let cols = v.split(",");
				if(cols.length != 2){
					result.isError = true;
					result.message = "illegal wall description: " + kv;
					return result;
				}

				let walls = decodeWall(cols[0], cols[1]);
				if(result.isError) return result;

				if( ! temp.walls) temp.walls = [];
				for(let w of walls) temp.walls.push(w);
			}
			else{
				result.isError = true;
				result.message = "unknown key: " + kv;
				return result;
			}
		}

		checkKeyExists("z");
		checkKeyExists("r");
		checkKeyExists("g");
		if(result.isError) return result;

		result.sizeName = temp.sizeName;

		result.robots = [temp.mainRobot];
		for(let r of temp.otherRobots) result.robots.push(r);

		result.walls = [temp.goalWall];
		for(let w of temp.centerWalls) result.walls.push(w);
		for(let w of temp.walls) result.walls.push(w);

		return result;
	};
}();
