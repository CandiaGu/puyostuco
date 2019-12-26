const playModes = ['multiplayer', 'singleplayerCPU'];

// Play
function selectPlayMode(mode) {
  // replace screen
  if (mode === 'multiplayer') {
    const playOptions = document.getElementById('play-options');
    playOptions.style.display = 'none';
    const selectRoom = document.getElementById('select-room');
    selectRoom.style.visibility = 'visible';
  } else if (mode === 'singleplayerCPU') {
  }
}

// Learn
function selectLearnModule(module) {
  localStorage.setItem('currentModule', module);
}

function onLoadLearnModule() {
  const module = localStorage.getItem('currentModule');
  document.getElementById(module + '-module').style.display = 'grid';
}

function selectAndReloadModule(module) {
  const prevModule = localStorage.getItem('currentModule');
  document.getElementById(prevModule + '-module').style.display = 'hidden';
  selectLearnModule(module);
  onLoadLearnModule();
}
