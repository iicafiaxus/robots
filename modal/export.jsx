const ExportModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			<div className="dialog-title">エクスポート</div>
			<div className="dialog-line-caption">現在の盤面コード</div>
			<div className="dialog-line">
				<textarea
					className="code"
					readOnly={true}
					value={game.state.exportingCode}
				/>
			</div>
			<div className="dialog-line-caption">外部ツール連携用コード{game.state.goalCount > 1 ? " (複数ゴールは非対応です)" : ""}</div>
			<div className="dialog-line">
				<textarea
					className="code"
					readOnly={true}
					value={game.state.foreignCode}
				/>
			</div>
		</div>
	);
}