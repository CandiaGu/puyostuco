import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Landing from './landing.js';
import Practice from './practice.js';
import Learn from './learn.js';
import LearnModule from './learnModule.js';
import Play from './play.js';
import Multiplayer from './multiplayer.js';
import * as ROUTES from './routes.js';

const App = () => (
  <Router>
    <div>
      <Route exact path={ROUTES.LANDING} component={Landing} />
      <Route path={ROUTES.PRACTICE} component={Practice} />
      <Route path={ROUTES.LEARN} component={Learn} />
      <Route path={ROUTES.LEARNMODULE} component={LearnModule} />
      <Route path={ROUTES.PLAY} component={Play} />
      <Route path={ROUTES.MULTIPLAYER} component={Multiplayer} />
    </div>
  </Router>
);

export default App;
