const ImportModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			<div className="dialog-title">インポート</div>
			<div className="dialog-line-caption">インポートする盤面コード</div>
			<div className="dialog-line">
				<textarea
					className="code"
					onChange={(e) => game.setState({ importingCode: e.target.value})}
					value={game.state.importingCode}
				/>
			</div>
			<div className="buttons setting-item">
				<button onClick={() => {game.closeModal(); game.importMap();}}>
					コードを盤面に反映する
				</button>
			</div>
		</div>
	);
}