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
  } else if (mode === 'game') {
    const selectRoom = document.getElementById('select-room');
    selectRoom.style.display = 'none';
    const gameMultiWrapper = document.getElementById('game-multi-wrapper');
    gameMultiWrapper.style.visibility = 'visible';
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
