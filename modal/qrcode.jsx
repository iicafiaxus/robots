const QrCodeModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			<div className="dialog-title">他のデバイスに共有</div>
			<div className="dialog-line">
				<input type="text" value={game.createShareUrl()} readOnly={true} />
				{ !!navigator.share &&
					<button className="material" onClick={() => game.sharePage()}>
						<span className="material-icons">share</span>
					</button>
				}
			</div>
			<SettingRadios
				title=""
				name="shareType"
				items={[
					{ value: 0, label: "アプリを共有" },
					{ value: 1, label: "盤面を共有" },
					{ value: 2, label: "コンテストとして共有" },
				]}
				value={game.state.shareType}
				setValue={v => game.setSettingValue("shareType", v)}
			/>
			<div className="dialog-line image-view qrcode">
				<QrCode size="200" data={game.createShareUrl()} />
			</div>
		</div>
	);
}

let QrCode = function(props){
	let size = props.size || 100;
	let data = encodeURIComponent(props.data) || location.href;
	return <img
		src={`https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=${size}x${size}`}
		width={size}
		height={size}
		alt={data}
	/>;
}