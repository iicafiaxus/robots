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
		const innerWidth = width - this.padding * 2;
		const innerHeight = height - this.padding * 2;
		const xs = this.policies.map(policy => (
			{ policy, scale: Math.min(innerWidth / policy.width, innerHeight / policy.height) }
		));
		xs.sort((a, b) => (b.scale - a.scale));
		const { policy, scale } = xs[0];
		const style = {
			outline: `1px dotted red`,
			transform: `scale(${scale * 100 + "%"})`,
			width: `${innerWidth / scale}px`,
			height: `${innerHeight / scale}px`,
			transformOrigin: `left top`,
			padding: `${this.padding / scale}px`,
		};
		return { policy, style };
	},
};