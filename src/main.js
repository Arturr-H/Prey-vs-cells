/*- Imports -*/
const { invoke } = window.__TAURI__.tauri;

/*- Elements -*/
const container = document.querySelector("#container");
const speedSlider = document.querySelector("#speed-slider");
const speedValue = document.querySelector("#speed-value");
const restartBtn = document.querySelector("#restart-button");

/*- Variables -*/
let speed = 100;
let updateInterval = null;

/*- Get tiles -*/
const tiles = (() => {
	const tiles = [];
	for (let i = 0; i < 20*20; i++) {
		/*- Create tile -*/
		const tile = document.createElement("div");
		tile.classList.add("cell");
		container.appendChild(tile);

		/*- Push tile -*/
		tiles.push(tile);
	}
	return tiles;
})();

/*- Create new game -*/
async function new_game() {
	updateInterval && clearInterval(updateInterval);
	await invoke("new_game");
	update();
}

/*- Update -*/
async function update() {
	await invoke("update").then(async () => {
		await invoke("get").then(e => e.forEach((cell, index) => {
			let tile = tiles[index];
			
			if (cell == 0) {
				tile.style.backgroundColor = "white";
			}else if (cell == 1) {
				tile.style.backgroundColor = "blue";
			}else if (cell == 2) {
				tile.style.backgroundColor = "red";
			}else if (cell == 3) {
				tile.style.backgroundColor = "black";
			}
		}));
	}).then(() => {
		/*- Recurse -*/
		updateInterval = setTimeout(() => update(), speed);
	});
}

/*- Event listeners -*/
speedSlider.addEventListener("input", () => {
	speed = speedSlider.value;
	speedValue.innerText = Math.max(100 - speed, 1);
});
restartBtn.addEventListener("click", () => new_game());

new_game();
// window.addEventListener("DOMContentLoaded", () => {
// 	greetInputEl = document.querySelector("#greet-input");
// 	greetMsgEl = document.querySelector("#greet-msg");
// 	document
// 		.querySelector("#greet-button")
// 		.addEventListener("click", () => greet());
// });
