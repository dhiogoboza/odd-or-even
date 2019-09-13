let configs = {
    calcButton: "#button_calc",
    formData: "#form_tests_data",
	evenResults: "#results_even",
	oddResults: "#results_odd",
	allResults: "#results_all",
	elapsedTime: "#elapsed_time"
};

let $calButton;
let $formData;
let $evenResults;
let $oddResults;
let $allResults;
let $elapsedTime;

let evenWins;
let oddWins;
let allSelectedNumbers;
let threadFinished;
let threadsCount;
let totalIterations;
let startTime;

function calculate(initialNumber, lastNumber, iterations, threads) {
	evenWins = 0;
	oddWins = 0;
	allSelectedNumbers = {};
	threadFinished = [];
	totalIterations = iterations;
	threadsCount = threads;

	for (let i = initialNumber; i <= lastNumber; i++) {
		allSelectedNumbers[i] = 0;
	}

	for (let i = 0; i < threads; i++) {
		threadFinished[i] = false;
	}

	let iterationsForThread = iterations / threads;
	startTime = new Date();
	for (let i = 0; i < threads; i++) {
		let threadIndex = i;
		
		if (window.Worker) {
			let data = [initialNumber, lastNumber, iterationsForThread, threadIndex];
			let worker = new Worker("js/calculate.js");
			worker.postMessage(data);
			worker.onmessage = function(e) {
				threadFinished[e.data[0]] = true;
				evenWins += e.data[1];
				oddWins += e.data[2];
				
				let workerResults = e.data[3];
				for (let i = initialNumber; i <= lastNumber; i++) {
					allSelectedNumbers[i] += workerResults[i];
				}
				
				checkAllFinished();
			};
		} else {
			setTimeout(function() {
				calculateThread(initialNumber, lastNumber, iterationsForThread, threadIndex);
			}, 50);
		}
	}
}

function checkAllFinished() {
	for (let i = 0; i < threadsCount; i++) {
		if (!threadFinished[i]) {
			// Thread not finished
			return;
		}
	}

	let evenPercentage = 100 * (evenWins / totalIterations);
	let oddPercentage = 100 * (oddWins / totalIterations);

	console.log("Even wins: " + evenWins + "(" + evenPercentage + "%)");
	console.log(" Odd wins: " + oddWins + "(" + oddPercentage + "%)");
	console.log(allSelectedNumbers);
	console.log("=====================");

	$evenResults.html(Math.round(evenPercentage * 100.0) / 100.0 + "%");
	$oddResults.html(Math.round(oddPercentage * 100.0) / 100.0 + "%");
	$allResults.html(JSON.stringify(allSelectedNumbers).replace(/,/g, ", "));

	let endTime = new Date();
	let seconds = Math.round((endTime - startTime) / 1000);

	$elapsedTime.html(seconds + " s");
	$calButton.removeAttr("disabled");
}

$(function() {
	$calButton = $(configs.calcButton);
	$formData = $(configs.formData);
	$evenResults = $(configs.evenResults);
	$oddResults = $(configs.oddResults);
	$allResults = $(configs.allResults);
	$elapsedTime = $(configs.elapsedTime);

	$formData.submit(function(e) {
		// get all the inputs into an array.
		let $inputs = $(':input', $formData);
		// not sure if you wanted this, but I thought I'd add it.
		// get an associative array of just the values.
		let values = {};
		$inputs.each(function() {
			values[this.name] = $(this).val();
		});
		calculate(values["input_first_number"], values["input_last_number"], values["input_iterations"], values["input_threads"]);
		$calButton.attr("disabled", true);
		e.preventDefault();
	});
});