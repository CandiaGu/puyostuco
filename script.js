
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
