const TutorialModal = (props) => {
	const { game } = props;

	return (
		<div className="modal dialog">
			<div className="dialog-title">タッチ操作の説明</div>
			<div className="dialog-line-caption">盤面をタップ → 解答・解説を表示</div>
			<div className="dialog-line image-view">
				<img src="images/tutorial-answer.png" />
				<span className="overlay">タップ</span>
			</div>
			<div className="dialog-line-caption">下にスワイプ → 現在の問題を破棄して次へ</div>
			<div className="dialog-line image-view">
				<img src="images/tutorial-discard.png" />
				<span className="overlay">スワイプ (モバイルのみ)</span>
			</div>

			<SettingRadios
				title="この操作説明を起動時に表示"
				name="useTutorial"
				items={[
					{ value: true, label: "する" },
					{ value: false, label: "しない" }
				]}
				value={game.state.useTutorial}
				setValue={v => game.setSettingValue("useTutorial", v)}
			/>
		</div>
	);
}