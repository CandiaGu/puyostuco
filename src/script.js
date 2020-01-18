// Play
function selectMultiplayer() {
  // replace screen
  const playOptions = document.getElementById('play-options');
  playOptions.style.display = 'none';
  const selectRoom = document.getElementById('select-room');
  selectRoom.style.visibility = 'visible';
}

// Learn
function selectLearnModule(module) {
  localStorage.setItem('currentModule', module);
}

function onLoadLearnModule() {
  const module = localStorage.getItem('currentModule');
  document.getElementById(`${module}-module`).style.display = 'grid';
}

function selectAndReloadModule(module) {
  const prevModule = localStorage.getItem('currentModule');
  document.getElementById(`${prevModule}-module`).style.display = 'none';
  selectLearnModule(module);
  onLoadLearnModule();
}

export {
  selectMultiplayer,
  selectLearnModule,
  onLoadLearnModule,
  selectAndReloadModule,
};
