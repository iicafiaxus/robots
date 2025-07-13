const EditModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			<div className="dialog-title">盤面編集</div>
			<div className="dialog-line">
				<EditBoard
					width={game.state.boardWidth}
					height={game.state.boardHeight}
					robots={game.state.robots}
					walls={game.state.walls}
					update={(cells) => game.updateEditResult(cells)}
					layoutName={game.state.layoutName}
				/>
			</div>
			<div className="dialog-line buttons">
				<button onClick={() => {game.closeModal(); game.importEdit();}}>
					盤面に反映する
				</button>
			</div>
		</div>
	);
}