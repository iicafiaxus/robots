const scaling = {
	padding: 16,
	policies: [
		{
			name: "default",
			width: 480,
			height: 960,
			toFit: "width",
		},
		{
			name: "board-landscape",
			width: 480,
			height: 720,
			toFit: "width",
		},
		{
			name: "screen-landscape",
			width: 960,
			height: 480,
			toFit: "height",
		},
	],

	calc: function(width, height) {
		const xs = this.policies.map(policy => {
			const widthScale = width / (policy.width + this.padding * 2);
			const heightScale = height / (policy.height + this.padding * 2);
			return { policy, scale: Math.min(widthScale, heightScale)}
		});
		xs.sort((a, b) => (b.scale - a.scale));
		const { policy, scale } = xs[0];
		const style = {
			outline: `1px dotted red`,
			transform: `scale(${scale * 100 + "%"})`,
			width: `${innerWidth / scale}px`,
			height: `${innerHeight / scale}px`,
			transformOrigin: `left top`,
		};
		return { policy, style };
	},
};