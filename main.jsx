"REQUIRE game.jsx";

let params = {
	small: {
		width: 8, height: 8, scale: 1.2, size: 50, isRectangular: false,
		hasCenterWall: false,
		cornerCount: 5, widthSideCount: 1, heightSideCount: 1
	},
	medium: {
		width: 8, height: 12, scale: 1.2, size: 50, isRectangular: true,
		hasCenterWall: true,
		cornerCount: 7, widthSideCount: 1, heightSideCount: 1
	},
	large: {
		width: 10, height: 14, scale: 1.0, size: 40, isRectangular: true,
		hasCenterWall: true,
		cornerCount: 11, widthSideCount: 1, heightSideCount: 2
	},
	large2: {
		width: 12, height: 16, scale: 1.0, size: 35, isRectangular: true,
		hasCenterWall: true,
		cornerCount: 13, widthSideCount: 2, heightSideCount: 2
	},
	large3: {
		width: 16, height: 16, scale: 1.0, size: 25, isRectangular: false,
		hasCenterWall: true,
		cornerCount: 17, widthSideCount: 2, heightSideCount: 2
	}
};

(function(){
	const dom = document.createElement("div");
	dom.className = "root";
	const root = ReactDOM.createRoot(dom);
	document.body.appendChild(dom);

	const urlParams = new URLSearchParams(window.location.search);
	const importCode = urlParams.get('code');

	root.render(<Game params={params} sizeName={"medium"} importCode={importCode} />);
})();
