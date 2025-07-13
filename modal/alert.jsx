const AlertModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			{game.state.alertTitle && <div className="dialog-title">{game.state.alertTitle}</div>}
			<div className="dialog-line">
				{game.state.alertMessage}
			</div>
			<div className="buttons setting-item">
				<button onClick={() => game.closeAlert()}>
					OK
				</button>
			</div>
		</div>
	);
}