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

/*- Graph -*/
let x_pos = 0;
const canvas = document.querySelector("#canvas");

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
	for (let i = 0; i < size * size; i++) {
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

	/*- Clear canvas -*/
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	x_pos = 0;

	await invoke("new_game", {
		"predatorDeathChance": parseFloat(document.querySelector("#predator-death-chance-slider").value),
		"predatorReproduceChance": parseFloat(document.querySelector("#predator-reproduce-chance-slider").value),
		"deathChance": parseFloat(document.querySelector("#cell-death-chance-slider").value),
		"reproduceChance": parseFloat(document.querySelector("#cell-reproduce-chance-slider").value),
		"spawnChance": parseFloat(document.querySelector("#cell-spawn-chance-slider").value),
		"predatorSpawnChance": parseFloat(document.querySelector("#predator-spawn-chance-slider").value),
		"size": parseInt(document.querySelector("#size-slider").value),
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
			} else if (cell == 1) {
				tile.style.backgroundColor = "#61b9eb";
			} else if (cell == 2) {
				tile.style.backgroundColor = "#61b9eb";
			} else if (cell == 3) {
				tile.style.backgroundColor = "#ea5a5a";
			}
		}));
	}).then(async () => {
		await invoke("preys_won").then(async e => {
			if (e == true) {
				updateInterval = null;
				alert("Preys won!");
			} else {
				await invoke("cells_won").then(e => {
					setProportions();

					if (e == true) {
						updateInterval = null;
						alert("Cells won!");
					} else {
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
async function setProportions() {
	await invoke("amount_of_cells").then(async cells => {
		await invoke("amount_of_predators").then(async predators => {
			await invoke("size").then(size => {
				let total = cells + predators;
				let preyProportion = cells / total;
				let predatorProportion = predators / total;
				appendToGraph([preyProportion, predatorProportion]);
				

				document.querySelector("#prey-proportion").style.width = preyProportion * 100 + "%";
				document.querySelector("#predator-proportion").style.width = predatorProportion * 100 + "%";
				document.querySelector("#dead-proportion").style.width = (size * size - total) / (size * size) * 100 + "%";
			})
		});
	});
}

/*- Draw lines from bottom ranging from 0 to height of canvas -*/
function appendToGraph(values) {
	if (x_pos >= canvas.width) {
		x_pos = 0;
	}
	values.forEach((value, index) => {
		let y_pos = value * canvas.height;
		let ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(x_pos, canvas.height);
		ctx.lineTo(x_pos, canvas.height - y_pos);

		/*- Set color -*/
		if (index == 0) {
			ctx.strokeStyle = "#8f9de3";
		} else if (index == 1) {
			ctx.strokeStyle = "#ea5a5a";
		}

		/*- Set width -*/
		ctx.lineWidth = 2;

		/*- Clear next line with a width of 2 -*/
		ctx.clearRect(x_pos + 2, 0, 2, canvas.height);
		ctx.stroke();
	});
	x_pos+=1;
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


