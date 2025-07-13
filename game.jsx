"REQUIRE board.jsx";
"REQUIRE buttons.jsx";
"REQUIRE editboard.jsx";
"REQUIRE mapmaker.js";
"REQUIRE robotsolve.js";
"REQUIRE robotdecode.js";
"REQUIRE robotencode.js";
"REQUIRE util/storage.js";
"REQUIRE scaling.js";
"REQUIRE modal/qrcode.jsx";
"REQUIRE modal/tutorial.jsx";
"REQUIRE modal/import.jsx";
"REQUIRE modal/export.jsx";
"REQUIRE modal/alert.jsx";
"REQUIRE modal/edit.jsx";

class Game extends React.Component {

	constructor(props){
		super(props);

		let sizeName = load("sizeName");
		if( ! props.params[sizeName]){
			sizeName = "medium";
			save("sizeName", sizeName);
		}

		let showAnswerAlways = load("showAnswerAlways") == "true";
		save("showAnswerAlways", showAnswerAlways);
		
		let showRobotName = load("showRobotName") == "true";
		save("showRobotName", showRobotName);

		let showGoalName = load("showGoalName") == "true";
		save("showGoalName", showGoalName);

		let useTutorial = (load("useTutorial") ?? load("useTutrial")) != "false";
		save("useTutorial", useTutorial);
		remove("useTutrial");

		let shareBoard = load("shareBoard") == "true";
		save("shareBoard", shareBoard);

		let useColorful = load("useColorful") != "false";
		save("useColorful", useColorful);

		let isDiagonal = load("isDiagonal") == "true";
		save("isDiagonal", isDiagonal);

		let isBoard3d = load("isBoard3d") == "true";
		save("isBoard3d", isBoard3d);

		let goalCount = +load("goalCount") || 1;
		save("goalCount", goalCount);

		this.state = {
			solution: {length: "計算中", description: "計算中"},
			isDescriptionOpen : false,
			params: props.params,
			sizeName,
			showAnswerAlways,
			showRobotName,
			showGoalName,
			useTutorial,
			useColorful,
			isDiagonal,
			goalCount,
			isBoard3d,
			shareBoard,
			layoutName: "",
			scalingStyle: {},
			importingCode: props.importCode,
		};
	}

	componentDidMount(){
		// インポートコードがある場合は処理
		if (this.state.importingCode) {
			this.importMap();
		} else {
			this.resetBoard();
			if(this.state.useTutorial) this.openModal("tutorial");
		}
		window.addEventListener("popstate", this.popState.bind(this));
		window.addEventListener("resize", this.onResize.bind(this));
		this.onResize();
	}

	componentWillUnmount(){
		window.removeEventListener("popstate", this.popState.bind(this));
		window.removeEventListener("resize", this.onResize.bind(this));
	}

	componentDidUpdate(){
		if(this.state.isModalOpen && document.querySelectorAll(".modal-front *:focus").length == 0){
			for(let x of document.querySelectorAll(".modal-front *")) if(x.tabIndex >= 0) {
				x.focus();
				if(x.tagName.toLowerCase() == "textarea") x.select();
				break; 
			}
		}
	}

	onResize(){
		const { width, height } = document.body.getBoundingClientRect()
		const { policy, style } = scaling.calc(width, height);
		this.setState({ layoutName: policy.name, scalingStyle: style });
	}

	removeQueryString(){
		const baseUrl = window.location.href.split('?')[0];
		window.history.replaceState({}, document.title, baseUrl);
	}
	importMap(){
		if( ! this.state.importingCode) return;
		let importParam = decoder.decode(this.state.importingCode);
		if(importParam.isError){
			this.openAlert("インポートは失敗しました。 (" + importParam.message + ")", "エラー");
			return;
		}
		this.setSettingValue("sizeName", importParam.sizeName);
		this.setSettingValue("goalCount", importParam.goalCount || 1);
		this.setState({ importingCode: void 0 });
		this.resetBoard({
			walls: importParam.walls,
			robots: importParam.robots,
			sizeName: importParam.sizeName,
		});
	}
	importEdit(){
		if( ! this.state.editResult) return;
		this.resetBoard({
			walls: this.state.editResult.walls,
			robots: this.state.editResult.robots
		});
	}
	updateEditResult(cells){
		let walls = [];
		let robots = [];
		for(let cell of cells){
			if(cell.robotName){
				const key1 = ["", "I", "A", "B", "C", "D", "E", "F", "G", "H"].findIndex(x => x == cell.robotName);
				const key2 = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"].findIndex(x => x == cell.robotName);
				const key = key1 >= 0 ? key1 : key2;
				robots.push({ x: cell.x, y: cell.y, key, isMain: key <= this.state.goalCount });
			}
			if(cell.wallType) walls.push({
				x: cell.x, y: cell.y, type: cell.wallType,
				isGoal: cell.isGoal, isShade: cell.isShade,
				goalColor: cell.isGoal ? (cell.goalColor || 0) : 0
			});
		}
		robots.sort((a, b) => a.key - b.key);
		this.setState({ editResult: { walls, robots } });
	}

	setSolution(solution){
		this.setState({ solution });
	}
	setNextSolution(solution){
		this.setState({ nextSolution: solution });
	}

	openAnswer(){
		this.setState({isAnswerOpen : true});
	}
	closeAnswer(){
		this.setState({isAnswerOpen : false});
	}
	toggleAnswer(){
		this.setState({isAnswerOpen : ! this.state.isAnswerOpen});
	}
	openDescription(){
		this.setState({isDescriptionOpen : true});
	}
	closeDescription(){
		this.setState({isDescriptionOpen : false});
	}
	toggleDescription(){
		this.setState({isDescriptionOpen : ! this.state.isDescriptionOpen});
	}
	
	showNextAnswer(){
		if( ! this.state.showAnswerAlways && ! this.state.isAnswerOpen){
			this.setState({ isAnswerOpen: true });
		}
		else if( ! this.state.isDescriptionOpen) this.setState({ isDescriptionOpen: true });
		else this.setState({ isAnswerOpen: false, isDescriptionOpen: false });
	}

	setIsDragging(isDragging){
		this.setState({ isDragging });
	}

	setIsSolving(isSolving){
		this.setState({ isSolving });
	}
	endSolving(){
		this.setIsSolving(false);
	}


	resetBoard(placement = {}){
		let param = {
			...this.state.params[placement.sizeName || this.state.sizeName],
			goalCount: placement.goalCount || this.state.goalCount,
		};
		
		if(this.solver){
			this.solver.stop();
			this.solver = null;
		}

		let walls, robots, solution;
		if(placement.walls && placement.robots){
			walls = placement.walls, robots = placement.robots;
			solution = void 0; 
			if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
		}
		else if(this.state.nextWalls && this.state.nextRobots &&
			! placement.sizeName && ! placement.goalCount){
			walls = this.state.nextWalls, robots = this.state.nextRobots;
			solution = this.state.nextSolution;
		}
		else{
			let map = mapMaker.make(param);
			walls = map.walls, robots = map.robots;
			solution = void 0;
			if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
		}

		this.setState({
			boardWidth: param.width,
			boardHeight: param.height,
			boardScale: param.scale,
			boardSize: param.size,
			robots: robots,
			walls: walls,
			solution: solution || {length: "…", description: "解析しています...",
				descriptions: [], liness: [[]]},
			nextSolution: void 0,
			lineNumber: 0,
			isLoading: true
		});
		this.closeAnswer();
		this.closeDescription();
		this.removeQueryString();

		if(this.nextSolver && this.nextSolver.isWorking){
			this.solver = this.nextSolver;
			this.solver.onFound = this.setSolution.bind(this);
			this.solver.onEnd = this.endSolving.bind(this);
			this.setIsSolving(this.solver.isWorking);
			this.nextSolver = null;
		}
		else setTimeout(function(){
			this.setState({ isLoading: false });

			this.solver = new Solver(
				param.width, param.height, this.state.robots, this.state.walls
			);
			this.setIsSolving(true);
			this.solver.solve(this.setSolution.bind(this), this.endSolving.bind(this));
		}.bind(this), 0);

		setTimeout(function(){
			let next = mapMaker.make(param);
			this.setState({
				nextWalls: next.walls, nextRobots: next.robots
			});

			setTimeout(function(){
				if(this.nextSolver) this.nextSolver.stop();
				this.nextSolver = new Solver(
					param.width, param.height, this.state.nextRobots, this.state.nextWalls,
					this.solver
				);
				this.nextSolver.solve(this.setNextSolution.bind(this));
			}.bind(this), 0);

		}.bind(this), 100);

	}

	createShareUrl(){
		const code = encoder.encode({
			sizeName: this.state.sizeName,
			robots: this.state.robots,
			walls: this.state.walls,
		});
		const baseUrl = window.location.href.split('?')[0];
		if(this.state.shareBoard) return `${baseUrl}?code=${code}`;
		else return baseUrl;
	}
	sharePage(){
		const shareUrl = this.createShareUrl();
		let data = {
			url: shareUrl,
			title: document.title
		};
		navigator.share(data);
	}

	openExport(){
		this.openModal("export");
		this.setState({
			exportingCode: encoder.encode({
				sizeName: this.state.sizeName,
				robots: this.state.robots,
				walls: this.state.walls,
			}),
			foreignCode: encoder.encodeExternal({
				width: this.state.boardWidth,
				height: this.state.boardHeight,
				robots: this.state.robots,
				walls: this.state.walls,
			}),
		});
	}
	openAlert(message, title){
		window.setTimeout(() => {
			this.setState({ alertMessage: message, alertTitle: title });
			this.openModal("alert");
		}, 0);
	}
	closeAlert(){
		this.setState({ alertMessage: void 0 });
		this.closeModal();
	}

	openModal(name){
		history.pushState({}, "", location.href);
		this.setState({ isModalOpen : true, modalName : name });
		for(let x of document.querySelectorAll("*")) if(x.tabIndex >= 0) x.tabIndex = -2;
		for(let x of document.querySelectorAll(".modal-front *")) if(x.tabIndex == -2) x.tabIndex = 0;
	}
	closeModal(){
		for(let x of document.querySelectorAll("*")) if(x.tabIndex == -2) x.tabIndex = 0;
		this.setState({ isModalOpen: false });
		history.back();
	}

	popState(e){
		if(this.state.isModalOpen){
			e.preventDefault();
			this.closeModal();
		}
	}

	setSettingValue(name, value){
		if(this.state[name] === value) return;
		this.setState({ [name] : value });
		save(name, value);
		if(name == "sizeName" || name == "goalCount"){
			if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
			this.setState({ nextWalls: void 0, nextRobots: void 0, nextSolution: void 0 });
			this.resetBoard({ [name]: value });
		}
	}

	renderSettingRadios(param){
		return (
			<SettingRadios
				title={param.title}
				name={param.name}
				prefix={param.prefix}
				items={param.items}
				value={this.state[param.name]}
				setValue={v => this.setSettingValue(param.name, v)}
			/>
		);
	}

	renderFunctionButtons1(){
		return <React.Fragment>
			<MaterialButton name="input" onClick={() => this.openModal("import")} />
			<MaterialButton name="edit" onClick={() => this.openModal("edit")} />
			<MaterialButton name="output" onClick={this.openExport.bind(this)} />
		</React.Fragment>
	}
	renderFunctionButtons2(){
		return <React.Fragment>
			<MaterialButton name="devices" onClick={() => this.openModal("qrcode")} />
			<MaterialButton name="help" onClick={() => this.openModal("tutorial")} />
			<MaterialButton name="settings" onClick={() => this.openModal("settings")} />
		</React.Fragment>
	}
	renderRefreshButton(){
		return <MaterialLargeButton name="refresh" onClick={this.resetBoard.bind(this)} />
	}
	renderQuestion(){
		return <div className="caption large">
			{ ! this.state.isDragging &&
				(this.state.showAnswerAlways ? "最短手数の手順は？" : "この盤面は何手？")
			}
		</div>
	}
	renderAnswerButton(){
		return <React.Fragment>
			<button className={"cover-title short2" +
				(this.state.showAnswerAlways ? " disabled" : "") + 
				(this.state.isDragging ? " inactive" : "") +
				( ! this.state.isDragging && (
					this.state.isAnswerOpen || this.state.showAnswerAlways
				) ? " isOpen" : "")
			}
				onClick={this.toggleAnswer.bind(this)}
			>{this.state.showAnswerAlways ? "手数" : "答え"}</button>
			<Covered value={this.state.solution.length}
				size="short2"
				large={true}
				isOpen={! this.state.isDragging && (
					this.state.isAnswerOpen || this.state.showAnswerAlways
				)}
				isActive={true}
				onClick={this.toggleAnswer.bind(this)}
			/>
		</React.Fragment>
	}

	renderButtonPane(){
		return <React.Fragment>
			<div className="buttons">
				{this.renderFunctionButtons1()}
				<div className="flex-filler" />
				{this.renderFunctionButtons2()}
			</div>

			<div className="buttons fullwidth">
				{this.renderRefreshButton()}
				<div className="flex-filler" />
				{this.renderQuestion()}
				<div className="flex-filler" />
				{this.renderAnswerButton()}
			</div>
		</React.Fragment>;
	}
	renderButtonPaneNarrow(){
		return <React.Fragment>
			<div className="buttons">
				{this.renderFunctionButtons1()}
				<div className="flex-filler" />
			</div>

			<div className="buttons">
				<div className="flex-filler" />
				{this.renderFunctionButtons2()}
			</div>

			<div className="buttons fullwidth">
				<div className="flex-filler" />
				{this.renderQuestion()}
				<div className="flex-filler" />
			</div>

			<div className="buttons fullwidth">
				{this.renderRefreshButton()}
				<div className="flex-filler" />
				{this.renderAnswerButton()}
			</div>
		</React.Fragment>;
	}

	renderBoardWrapper(param){
		return <div className="board-wrapper">
			<Board 
				width={param.width}
				height={param.height}
				scale={param.scale}
				layoutName={this.state.layoutName}
				robots={this.state.nextRobots || []} walls={this.state.nextWalls || []}
				lines={[]}
				showsNumber={false}
				showsRoute={false}
				isLoading={false}
				showAnswer={null}
				resetBoard={null}
				setIsDragging={null}
				isBack={true}
				is3d={this.state.isBoard3d}
			/>

			<Board 
				width={this.state.boardWidth}
				height={this.state.boardHeight}
				scale={this.state.boardScale}
				layoutName={this.state.layoutName}
				robots={this.state.robots} walls={this.state.walls}
				goalCount={this.state.goalCount}
				lines={this.state.solution.liness && 
					this.state.solution.liness[this.state.lineNumber]}
				showsNumber={this.state.isDescriptionOpen || this.state.showRobotName}
				showsRoute={this.state.isDescriptionOpen}
				isLoading={this.state.isLoading}
				showAnswer={this.showNextAnswer.bind(this)}
				useColorful={this.state.useColorful}
				showsGoalName={this.state.showGoalName}
				isDiagonal={this.state.isDiagonal}
				resetBoard={this.resetBoard.bind(this)}
				setIsDragging={this.setIsDragging.bind(this)}
				is3d={this.state.isBoard3d}
			/>
		</div>
	}

	renderAnswerPane(){
		return <div className="buttonset">
			{(this.state.isDragging || ! this.state.isDescriptionOpen) &&
				<div className="buttons fullwidth">
					<button className={"cover-title long" + 
						(this.state.isDragging ? " inactive" : "")
					}
						onClick={this.toggleDescription.bind(this)}
					>{this.state.showAnswerAlways ? "解答例" : "解説"}</button>
				</div>
			}

			{this.state.solution && this.state.solution.descriptions &&
				this.state.solution.descriptions.concat(
					this.state.isSolving ? ["解析しています…"] : []
				).map(
				(description, i) =>

				<div className="buttons fullwidth" key={i}>
					<Covered
						title={this.state.showAnswerAlways ? "解答例" : "解説"}
						value={rotateArrows(description, {
							diagonal: !!this.state.isDiagonal,
							transposed: ["board-landscape", "screen-landscape"].includes(this.state.layoutName)
						})}
						size="fullwidth"
						large={true}
						isOpen={ ! this.state.isDragging && this.state.isDescriptionOpen}
						isActive={this.state.lineNumber == i}
						onClick={
							this.state.lineNumber == i ?
							this.toggleDescription.bind(this) :
							() => this.setState({ lineNumber: i })
						}
					/>
				</div>
			)}
		</div>
	}

	render(){
		let param = this.state.params[this.state.sizeName];
		return <div className={[
			"scalable",
			(this.state.layoutName ? "layout-" + this.state.layoutName : "")
		].join(" ").replaceAll(/ +/g, " ")}
		style={this.state.scalingStyle}
		>
			<div
				className={[
					"all",
					"size" + this.state.boardSize,
					(this.state.isDiagonal ? "diagonal" : ""),
					(param.isRectangular ? "rectangular" : ""),
				].join(" ").replaceAll(/ +/g, " ")}
			>

				{this.state.layoutName != "screen-landscape" && (
					<React.Fragment>
						<div className="main-pane">
							{this.renderButtonPane()}
							{this.renderBoardWrapper(param)}
							{this.renderAnswerPane()}
						</div>
					</React.Fragment>
				)}
				{this.state.layoutName == "screen-landscape" && (
					<React.Fragment>
						<div className="side-pane">
							{this.renderButtonPaneNarrow()}
							{this.renderAnswerPane()}
						</div>
						<div className="main-pane">
							{this.renderBoardWrapper(param)}
						</div>
					</React.Fragment>
				)}

			</div>

			{this.state.isModalOpen	&&
				<div className="modal-back" onClick={this.closeModal.bind(this)} />
			}

			{this.state.isModalOpen	&&
				<div className="modal-front">
					{this.state.modalName == "settings" &&
						<div className="modal dialog setting-section">

							<div className="setting-title">サイズ (変更すると現在の盤面は破棄します)</div>

							{this.renderSettingRadios({
								title: "",
								name: "sizeName",
								items: [
									{ value: "small", caption: "小 (8×8)" },
									{ value: "medium", caption: "中 (8×12)" },
									{ value: "large", caption: "大 (10×14)" },
									{ value: "large2", caption: "特大 (12×16)" },
									{ value: "large3", caption: "フルサイズ (16×16)" },
								]
							})}

							<div className="setting-title">ゴールの個数 (変更すると現在の盤面は破棄します)</div>

							{this.renderSettingRadios({
								title: "",
								name: "goalCount",
								items: [
									{ value: 1, caption: "1" },
									{ value: 2, caption: "2 (実験的)" },
									//{ value: 4, caption: "4 (実験的!!)" },
								]
							})}

							<div className="setting-title">表示設定</div>

							{this.renderSettingRadios({
								title: "",
								name: "showAnswerAlways",
								items: [
									{ value: true, caption: "出題時に最短手数を表示する" },
									{ value: false, caption: "しない" },
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "showRobotName",
								items: [
									{ value: true, caption: "出題時にコマの名称を表示する" },
									{ value: false, caption: "しない" },
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "showGoalName",
								items: [
									{ value: true, caption: "ゴールの名称を表示する" },
									{ value: false, caption: "しない" },
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "useTutorial",
								items: [
									{ value: true, caption: "起動時に操作説明を表示する" },
									{ value: false, caption: "しない" }
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "useColorful",
								items: [
									{ value: true, caption: "コマを色分けする" },
									{ value: false, caption: "しない" }
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "isDiagonal",
								items: [
									{ value: true, caption: "盤面を45度回転する" },
									{ value: false, caption: "しない" },
								]
							})}

							{this.renderSettingRadios({
								title: "",
								name: "isBoard3d",
								items: [
									{ value: true, caption: "テクスチャで表示 (実験的)" },
									{ value: false, caption: "しない" },
								]
							})}
						</div>
					}


					{this.state.modalName == "qrcode" && <QrCodeModal game={this} />}

					{this.state.modalName == "tutorial" && <TutorialModal game={this} />}

					{this.state.modalName == "import" && <ImportModal game={this} />}

					{this.state.modalName == "edit" && <EditModal game={this} />}

					{this.state.modalName == "export" && <ExportModal game={this} />}

					{this.state.modalName == "alert" && <AlertModal game={this} />}

				</div>
			}
		</div>
	}
}



let rotateArrows = function(text, param){
	const toDiagonal = (text) => text.replaceAll("↑", "↖").replaceAll("→", "↗").replaceAll("↓", "↘").replaceAll("←", "↙");
	const toTransposed = (text) => (text).replaceAll("↖", "→").replaceAll("↗", "↓").replaceAll("↘", "←").replaceAll("↙", "↑");
	if( ! param.diagonal && ! param.transposed) return text;
	if(param.diagonal && ! param.transposed) return toDiagonal(text);
	if( ! param.diagonal && param.transposed) return toTransposed(toDiagonal(text));
	if(param.diagonal && param.transposed) return toDiagonal(toTransposed(toDiagonal(text)));
}

