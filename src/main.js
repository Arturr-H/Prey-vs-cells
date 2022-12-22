/*- Imports -*/
const { invoke } = window.__TAURI__.tauri;

/*- Elements -*/
const container = document.querySelector("#container");
const speedSlider = document.querySelector("#speed-slider");
const sizeSlider = document.querySelector("#size-slider");
const speedValue = document.querySelector("#speed-value");
const sizeValue = document.querySelector("#size-value");
const restartBtn = document.querySelector("#restart-button");
const slidersContainer = document.querySelector("#sliders");

/*- Configuration sliders -*/
const sliders = {
	"predator-death-chance": {
		value: 0.005,
	},
	"predator-reproduce-chance": {
		value: 0.1,
	},
	"cell-death-chance": {
		value: 0.0,
	},
	"cell-reproduce-chance": {
		value: 0.5,
	},
	"cell-spawn-chance": {
		value: 0.3,
	},
	"predator-spawn-chance": {
		value: 0.1,
	}
};

/*- Create sliders -*/
(() => {
	Object.keys(sliders).forEach(key => {
		/*- Create elements -*/
		const p = document.createElement("p");
		const div = document.createElement("div");
		const input = document.createElement("input");
		const value = document.createElement("p");

		/*- Set attributes -*/
		p.innerText = key;
		div.classList.add("range");
		input.id = key + "-slider";
		input.type = "range";
		input.min = "0";
		input.max = "1";
		input.step = "0.001";
		input.value = sliders[key].value;
		input.classList.add("slider");
		value.classList.add("value");
		value.id = key + "-slider-value";
		value.innerText = sliders[key].value;

		/*- Add event listener -*/
		input.addEventListener("input", () => {
			/*- Round to 3 decimal places -*/
			let rounded = Math.round(input.value * 1000) / 1000;

			/*- Set value -*/
			value.innerText = rounded;
		});

		/*- Append elements -*/
		div.appendChild(input);
		div.appendChild(value);
		slidersContainer.appendChild(p);
		slidersContainer.appendChild(div);
	});
})();

/*- Variables -*/
let speed = 100;
let size = 20;
let updateInterval = null;

const generateTiles = () => {
	const tiles = [];
	for (let i = 0; i < size*size; i++) {
		/*- Create tile -*/
		const tile = document.createElement("div");
		tile.classList.add("cell");
		container.appendChild(tile);

		/*- Push tile -*/
		tiles.push(tile);
	}
	return tiles;
};

/*- Get tiles -*/
let tiles = generateTiles();

/*- Create new game -*/
async function new_game() {
	updateInterval && clearInterval(updateInterval);
	await invoke("new_game", {
		"predatorDeathChance"    : parseFloat(document.querySelector("#predator-death-chance-slider").value),
		"predatorReproduceChance": parseFloat(document.querySelector("#predator-reproduce-chance-slider").value),
		"deathChance"        : parseFloat(document.querySelector("#cell-death-chance-slider").value),
		"reproduceChance"    : parseFloat(document.querySelector("#cell-reproduce-chance-slider").value),
		"spawnChance"        : parseFloat(document.querySelector("#cell-spawn-chance-slider").value),
		"predatorSpawnChance"    : parseFloat(document.querySelector("#predator-spawn-chance-slider").value),
		"size"               : parseInt(document.querySelector("#size-slider").value),
	});
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
				tile.style.backgroundColor = "#61b9eb";
			}else if (cell == 2) {
				tile.style.backgroundColor = "#61b9eb";
			}else if (cell == 3) {
				tile.style.backgroundColor = "#0080dd";
			}
		}));
	}).then(async() => {
		await invoke("preys_won").then(async e => {
			if (e == true) {
				updateInterval = null;
				alert("Preys won!");
			}else {
				await invoke("cells_won").then(e => {
					if (e == true) {
						updateInterval = null;
						alert("Cells won!");
					}else {
						updateIterations();
						/*- Recurse -*/
						updateInterval = setTimeout(() => update(), speed);
					}
				});
			}
		});
	});
}
async function updateIterations() {
	await invoke("iterations").then(e => {
		document.querySelector("#iterations").innerText = e;
	});
}


/*- Event listeners -*/
speedSlider.addEventListener("input", () => {
	speed = speedSlider.value;
	speedValue.innerText = Math.max(100 - speed, 1);
});
sizeSlider.addEventListener("input", () => {
	sizeValue.innerText = sizeSlider.value;
	size = parseInt(sizeSlider.value);

	/*- Update css variables -*/
	document.documentElement.style.setProperty("--size", sizeSlider.value);

	/*- Remove tiles -*/
	tiles.forEach(tile => tile.remove());

	/*- Create new tiles -*/
	tiles = generateTiles();
});

restartBtn.addEventListener("click", () => new_game());


