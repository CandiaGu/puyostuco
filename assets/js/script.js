
const playModes = ['multiplayer', 'singleplayerCPU'];

// Play
function selectPlayMode(mode){
	// replace screen

	if(mode == 'multiplayer'){
		playOptions = document.getElementById("play-options");
		playOptions.style.display = "none";

		selectRoom = document.getElementById("select-room");
		selectRoom.style.visibility = "visible";
	}
	else if(mode == 'singleplayerCPU'){


	}

}

//Learn
function selectLearnModule(module){
	localStorage.setItem("currentModule",module);
}

function onLoadLearnModule(){

	let module = localStorage.getItem("currentModule")
	document.getElementById(module+"-module").style.display = "grid";
}

function selectAndReloadModule(module){
	let prevModule = localStorage.getItem("currentModule")
	document.getElementById(prevModule+"-module").style.display = "hidden";
	selectLearnModule(module);
	onLoadLearnModule();
}