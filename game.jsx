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

		let paramName = load("paramName");
		if( ! props.params[paramName]){
			paramName = "medium";
			save("paramName", paramName);
		}

		let showAnswerAlways = load("showAnswerAlways") == "true";
		save("showAnswerAlways", showAnswerAlways);
		
		let showRobotName = load("showRobotName") == "true";
		save("showRobotName", showRobotName);

		let useTutrial = load("useTutrial") != "false";
		save("useTutrial", useTutrial);

		this.state = {
			solution: {length: "計算中", description: "計算中"},
			isDescriptionOpen : false,
			params: props.params,
			paramName,
			showAnswerAlways,
			showRobotName,
			useTutrial
		};
	}

	componentWillMount(){
	}

	componentDidMount(){
		this.resetBoard();
		if(this.state.useTutrial) this.openTutrial();
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
		this.setParamName(importParam.paramName);
		this.setState({
			importedWalls: importParam.walls,
			importedRobots: importParam.robots,
			importingCode: void 0
		});
	}
	importEdit(){
		if( ! this.state.editResult) return;
		if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
		this.setState({
			nextWalls: this.state.editResult.walls,
			nextRobots: this.state.editResult.robots,
			nextSolution: void 0,
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
				x: cell.x, y: cell.y, type: cell.wallType, isGoal: cell.isGoal, isShade: cell.isShade
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


	resetBoard(){
		let param = this.state.params[this.state.paramName];
		
		if(this.solver){
			this.solver.stop();
			this.solver = null;
		}

		let walls, robots;
		if(this.state.importedWalls && this.state.importedRobots){
			walls = this.state.importedWalls, robots = this.state.importedRobots;
			this.state.importedWalls = void 0, this.state.importedRobots = void 0;
		}
		else if(this.state.nextWalls && this.state.nextRobots){
			walls = this.state.nextWalls, robots = this.state.nextRobots;
		}
		else{
			let map = mapMaker.make(param);
			walls = map.walls, robots = map.robots;
		}

		this.setState({
			boardWidth: param.width,
			boardHeight: param.height,
			boardScale: param.scale,
			boardSize: param.size,
			robots: robots,
			walls: walls,
			solution: {length: "…", description: "解析しています...",
				descriptions: [], liness: [[]]},
			lineNumber: 0,
			isLoading: true
		});
		this.closeAnswer();
		this.closeDescription();

		if(this.state.nextSolution){
			this.setState({
				solution: this.state.nextSolution,
				nextSolution: null
			});
		}
		else if(this.nextSolver && this.nextSolver.isWorking){
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

	openSettings(){
		this.openModal("settings");
	}
	openMobileLink(){
		this.openModal("qrcode");
	}
	openTutrial(){
		this.openModal("tutrial");
	}
	openImport(){
		this.openModal("import");
	}
	openEdit(){
		this.openModal("edit");
	}
	openExport(){
		this.openModal("export");
		this.setState({
			exportingCode: encoder.encode({
				paramName: this.state.paramName,
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

	setParamName(name){
		if(this.nextSolver) this.nextSolver.stop(), this.nextSolver = null;
		this.setState({ paramName : name,
			nextWalls: void 0, nextRobots: void 0, nextSolution: void 0 });
		save("paramName", name);
	}
	setShowAnswerAlways(value){
		this.setState({ showAnswerAlways : !! value });
		save("showAnswerAlways", value);
	}
	setShowRobotName(value){
		this.setState({ showRobotName : !! value });
		save("showRobotName", value);
	}
	setUseTutrial(value){
		this.setState({ useTutrial : !! value });
		save("useTutrial", value);
	}


	setSettingValue(name, value){
		this.setState({ [name] : value });
		save(name, value);
	}

	render(){
		let param = this.state.params[this.state.paramName];
		return <div>
			<div className={"all scalable" + 
				(" size" + this.state.boardSize)
			}>
				<div className="buttons">

					<MaterialButton name="input" onClick={this.openImport.bind(this)} />
					<MaterialButton name="edit" onClick={this.openEdit.bind(this)} />
					<MaterialButton name="output" onClick={this.openExport.bind(this)} />
					<div className="flex-filler" />
					<MaterialButton name="devices" onClick={this.openMobileLink.bind(this)} />
					<MaterialButton name="help" onClick={this.openTutrial.bind(this)} />
					<MaterialButton name="settings" onClick={this.openSettings.bind(this)} />

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
				<div className="buttons">
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
								value={description}
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

							<div className="buttons setting-item">
								<div className="setting-title">サイズ (次の問題から有効)</div>
								<label>
									<input type="radio" name="param" value="small"
										checked={this.state.paramName == "small"}
										onChange={() => this.setParamName("small")} />
									<span>小 (8×8)</span>
								</label>
								<label>
									<input type="radio" name="param" value="medium"
										checked={this.state.paramName == "medium"}
										onChange={() => this.setParamName("medium")} />
									<span>中 (8×12)</span>
								</label>
								<label>
									<input type="radio" name="param" value="large"
										checked={this.state.paramName == "large"}
										onChange={() => this.setParamName("large")} />
									<span>大 (10×14)</span>
								</label>
								<label>
									<input type="radio" name="param" value="large2"
										checked={this.state.paramName == "large2"}
										onChange={() => this.setParamName("large2")} />
									<span>特大 (12×16)</span>
								</label>
								<label>
									<input type="radio" name="param" value="large3"
										checked={this.state.paramName == "large3"}
										onChange={() => this.setParamName("large3")} />
									<span>フルサイズ (16×16)</span>
								</label>
							</div>

							<div className="buttons setting-item">
								<div className="setting-title">出題形式</div>
								<label>
									<input type="radio" name="showansweralways" value="false"
										checked={ ! this.state.showAnswerAlways}
										onChange={() => this.setShowAnswerAlways(false)} />
									<span>この盤面は何手？</span>
								</label>
								<label>
									<input type="radio" name="showansweralways" value="true"
										checked={ !! this.state.showAnswerAlways}
										onChange={() => this.setShowAnswerAlways(true)} />
									<span>最短手数の手順は？</span>
								</label>
							</div>

							<div className="buttons setting-item">
								<div className="setting-title">コマの識別方法</div>
								<label>
									<input type="radio" name="showrobotname" value="false"
										checked={ ! this.state.showRobotName}
										onChange={() => this.setShowRobotName(false)} />
									<span>色で区別する</span>
								</label>
								<label>
									<input type="radio" name="showrobotname" value="true"
										checked={this.state.showRobotName}
										onChange={() => this.setShowRobotName(true)} />
									<span>色と名前で区別する</span>
								</label>
							</div>

							<div className="buttons setting-item">
								<div className="setting-title">起動時の操作説明</div>
								<label>
									<input type="radio" name="usetutrial" value="true"
										checked={ !! this.state.useTutrial}
										onChange={() => this.setUseTutrial(true)} />
									<span>操作説明あり</span>
								</label>
								<label>
									<input type="radio" name="usetutrial" value="false"
										checked={ ! this.state.useTutrial}
										onChange={() => this.setUseTutrial(false)} />
									<span>操作説明なし</span>
								</label>
							</div>


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
								<span className="overlay">スワイプ</span>
							</div>
							<div className="buttons setting-item">
								<span>この操作説明を起動時に表示</span>
								<label>
									<input type="radio" name="usetutrial" value="true"
										checked={ !! this.state.useTutrial}
										onChange={() => this.setUseTutrial(true)} />
									<span>する</span>
								</label>
								<label>
									<input type="radio" name="usetutrial" value="false"
										checked={ ! this.state.useTutrial}
										onChange={() => this.setUseTutrial(false)} />
									<span>しない</span>
								</label>
							</div>
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
									インポート (更新後有効)
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
							<div className="buttons setting-item">
								<button onClick={() => this.closeModal() + this.importEdit()}>
									反映 (更新後有効)
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

