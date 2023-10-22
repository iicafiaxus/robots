"REQUIRE board.jsx";
"REQUIRE buttons.jsx";
"REQUIRE editboard.jsx";
"REQUIRE mapmaker.js";
"REQUIRE robotsolve.js";
"REQUIRE robotdecode.js";
"REQUIRE robotencode.js";
"REQUIRE util/storage.js";

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

		let useTutrial = load("useTutrial") != "false";
		save("useTutrial", useTutrial);

		let useColorful = load("useColorful") == "true";
		save("useColorful", useColorful);

		let isDiagonal = load("isDiagonal") == "true";
		save("isDiagonal", isDiagonal);

		this.state = {
			solution: {length: "計算中", description: "計算中"},
			isDescriptionOpen : false,
			params: props.params,
			sizeName,
			showAnswerAlways,
			showRobotName,
			useTutrial,
			useColorful,
			isDiagonal,
		};
	}

	componentDidMount(){
		this.resetBoard();
		if(this.state.useTutrial) this.openModal("tutrial");
		window.addEventListener("popstate", this.popState.bind(this));
	}

	componentWillUnmount(){
		window.removeEventListener("popstate", this.popState.bind(this));
	}

	importMap(){
		if( ! this.state.importingCode) return;
		let importParam = decoder.decode(this.state.importingCode);
		if(importParam.isError){
			this.openAlert("インポートは失敗しました。 (" + importParam.message + ")", "エラー");
			return;
		}
		this.setSettingValue("sizeName", importParam.sizeName);
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
			if(cell.robotName) robots.push({
				x: cell.x, y: cell.y, isMain: cell.robotName==="●",
				key: ["", "●", "A", "B", "C", "D", "E", "F", "G", "H"].findIndex(x => x == cell.robotName),
			});
			if(cell.wallType) walls.push({
				x: cell.x, y: cell.y, type: cell.wallType,
				isGoal: cell.isGoal, isShade: cell.isShade, goalColor: cell.isGoal ? 1 : 0
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


	resetBoard(placement){
		let param = {
			...this.state.params[placement && placement.sizeName || this.state.sizeName],
			goalCount: 1,
		};
		
		if(this.solver){
			this.solver.stop();
			this.solver = null;
		}

		let walls, robots, solution;
		if(placement && placement.walls && placement.robots){
			walls = placement.walls, robots = placement.robots;
			solution = void 0; 
			if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
		}
		else if(this.state.nextWalls && this.state.nextRobots && ! placement.sizeName){
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

	sharePage(){
		let data = {
			url: location.href,
			title: window.title
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
	}
	closeModal(){
		this.setState({ isModalOpen: false });
		history.back();
	}

	popState(e){
		if(this.state.isModalOpen){
			history.pushState({}, "", location.href);
			this.closeModal();
		}
	}

	setSettingValue(name, value){
		if(this.state[name] === value) return;
		this.setState({ [name] : value });
		save(name, value);
		if(name == "sizeName"){
			if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
			this.setState({ nextWalls: void 0, nextRobots: void 0, nextSolution: void 0 });
			this.resetBoard({ sizeName: value });
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

	render(){
		let param = this.state.params[this.state.sizeName];
		return <div>
			<div className={"all scalable size" + this.state.boardSize + 
				(this.state.isDiagonal ? " diagonal" : "")}>
				<div className="buttons">

					<MaterialButton name="input" onClick={() => this.openModal("import")} />
					<MaterialButton name="edit" onClick={() => this.openModal("edit")} />
					<MaterialButton name="output" onClick={this.openExport.bind(this)} />
					<div className="flex-filler" />
					<MaterialButton name="devices" onClick={() => this.openModal("qrcode")} />
					<MaterialButton name="help" onClick={() => this.openModal("tutrial")} />
					<MaterialButton name="settings" onClick={() => this.openModal("settings")} />

				</div>

				<div className="buttons fullwidth">

					<MaterialLargeButton name="refresh" onClick={this.resetBoard.bind(this)} />
					<div className="flex-filler" />

					<div className="caption large">
						{ ! this.state.isDragging &&
							(this.state.showAnswerAlways ? "最短手数の手順は？" : "この盤面は何手？")
						}
					</div>

					<div className="flex-filler" />

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

				</div>
				
				<div className="board-wrapper">
					<Board 
						width={param.width}
						height={param.height}
						scale={param.scale}
						robots={this.state.nextRobots || []} walls={this.state.nextWalls || []}
						lines={[]}
						showsNumber={false}
						showsRoute={false}
						isLoading={false}
						showAnswer={null}
						resetBoard={null}
						setIsDragging={null}
						isBack={true}
					/>

					<Board 
						width={this.state.boardWidth}
						height={this.state.boardHeight}
						scale={this.state.boardScale}
						robots={this.state.robots} walls={this.state.walls}
						lines={this.state.solution.liness && 
							this.state.solution.liness[this.state.lineNumber]}
						showsNumber={this.state.isDescriptionOpen || this.state.showRobotName}
						showsRoute={this.state.isDescriptionOpen}
						isLoading={this.state.isLoading}
						showAnswer={this.showNextAnswer.bind(this)}
						useColorful={this.state.useColorful}
						isDiagonal={this.state.isDiagonal}
						resetBoard={this.resetBoard.bind(this)}
						setIsDragging={this.setIsDragging.bind(this)}
					/>
				</div>


				<div className="buttonset">

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
								value={this.state.isDiagonal ? rotateArrows(description) : description}
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

			</div>

			{this.state.isModalOpen	&&
				<div className="modal-back" onClick={this.closeModal.bind(this)} />
			}

			{this.state.isModalOpen	&&
				<div className="modal-front">

					{this.state.modalName == "settings" &&
						<div className="modal setting-section">

							{this.renderSettingRadios({
								title: "サイズ (変更すると現在の盤面は破棄します)",
								name: "sizeName",
								items: [
									{ value: "small", caption: "小 (8×8)" },
									{ value: "medium", caption: "中 (8×12)" },
									{ value: "large", caption: "大 (10×14)" },
									{ value: "large2", caption: "特大 (12×16)" },
									{ value: "large3", caption: "フルサイズ (16×16)" },
								]
							})}

							{this.renderSettingRadios({
								title: "出題形式",
								name: "showAnswerAlways",
								items: [
									{ value: false, caption: "この盤面は何手？" },
									{ value: true, caption: "最短手数の手順は？" }
								]
							})}

							{this.renderSettingRadios({
								title: "コマの名称",
								name: "showRobotName",
								items: [
									{ value: true, caption: "つねに表示する" },
									{ value: false, caption: "解説時のみ" },
								]
							})}

							{this.renderSettingRadios({
								title: "起動時の操作説明",
								name: "useTutrial",
								items: [
									{ value: true, caption: "操作説明あり" },
									{ value: false, caption: "操作説明なし" }
								]
							})}

							{this.renderSettingRadios({
								title: "コマの色",
								name: "useColorful",
								items: [
									{ value: true, caption: "カラフル" },
									{ value: false, caption: "素朴" }
								]
							})}

							{this.renderSettingRadios({
								title: "盤面の角度",
								name: "isDiagonal",
								items: [
									{ value: false, caption: "通常" },
									{ value: true, caption: "斜め (45度)" }
								]
							})}

						</div>
					}

					{this.state.modalName == "qrcode" &&
						<div className="modal dialog">
							<div className="dialog-title">他のデバイスで開く</div>
							<div className="dialog-line">
								<input type="text" value={location.href} readOnly={true} />
								{ !!navigator.share &&
									<button className="material" onClick={this.sharePage.bind(this)}>
										<span className="material-icons">share</span>
									</button>
								}
							</div>
							<div className="dialog-line image-view qrcode">
								<QrCode size="200" data={location.href} />
							</div>										
						</div>
					}

					{this.state.modalName == "tutrial" &&
						<div className="modal dialog">
							<div className="dialog-title">タッチ操作の説明</div>
							<div className="dialog-line-caption">盤面をタップ → 解答・解説を表示</div>
							<div className="dialog-line image-view">
								<img src="images/tutrial-answer.png" />
								<span className="overlay">タップ</span>
							</div>
							<div className="dialog-line-caption">下にスワイプ → 現在の問題を破棄して次へ</div>
							<div className="dialog-line image-view">
								<img src="images/tutrial-discard.png" />
								<span className="overlay">スワイプ (モバイルのみ)</span>
							</div>

							{this.renderSettingRadios({
								name: "useTutrial",
								prefix: "この操作説明を起動時に表示",
								items: [
									{ value: true, caption: "する" },
									{ value: false, caption: "しない" }
								]
							})}
						</div>
					}

					{this.state.modalName == "import" &&
						<div className="modal dialog">
							<div className="dialog-title">インポート</div>
							<div className="dialog-line-caption">インポートする盤面コード</div>
							<div className="dialog-line">
								<textarea
									className="code"
									onChange={(e) => this.setState({ importingCode: e.target.value})}
									value={this.state.importingCode}
								/>
							</div>
							<div className="buttons setting-item">
								<button onClick={() => this.closeModal() + this.importMap()}>
									コードを盤面に反映する
								</button>
							</div>
						</div>
					}

					{this.state.modalName == "edit" &&
						<div className="modal dialog">
							<div className="dialog-title">盤面編集</div>
							<div className="dialog-line">
								<EditBoard
									width={this.state.boardWidth}
									height={this.state.boardHeight}
									robots={this.state.robots}
									walls={this.state.walls}
									update={(cells) => this.updateEditResult(cells)}
								/>
							</div>
							<div className="dialog-line buttons">
								<button onClick={() => this.closeModal() + this.importEdit()}>
									盤面に反映する
								</button>
							</div>
						</div>
					}

					{this.state.modalName == "export" &&
						<div className="modal dialog">
							<div className="dialog-title">エクスポート</div>
							<div className="dialog-line-caption">現在の盤面コード</div>
							<div className="dialog-line">
								<textarea
									className="code"
									readOnly={true}
									value={this.state.exportingCode}
								/>
							</div>
							<div className="dialog-line-caption">外部ツール連携用コード</div>
							<div className="dialog-line">
								<textarea
									className="code"
									readOnly={true}
									value={this.state.foreignCode}
								/>
							</div>
						</div>
					}

					{this.state.modalName == "alert" &&
						<div className="modal dialog">
							{this.state.alertTitle && <div className="dialog-title">{this.state.alertTitle}</div>}
							<div className="dialog-line">
								{this.state.alertMessage}
							</div>
							<div className="buttons setting-item">
								<button onClick={() => this.closeAlert()}>
									OK
								</button>
							</div>
						</div>
					}

				</div>
			}
		</div>
	}
}

let QrCode = function(props){
	let size = props.size || 100;
	let data = encodeURI(props.data) || location.href;
	return <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=${size}x${size}`} alt={data} />
}

let rotateArrows = function(text){
	return text.replaceAll("↑", "↖").replaceAll("→", "↗").replaceAll("↓", "↘").replaceAll("←", "↙");
}

