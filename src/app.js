import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { withAuthentication } from './session.js';
import Header from './header.js';
import Landing from './landing.js';
import Practice from './practice.js';
import Learn from './learn.js';
import LearnModule from './learnModule.js';
import Play from './play.js';
import SignUp from './signUp.js';
import SignIn from './signIn.js';
import PasswordForget from './passwordForget.js';
import Account from './account.js';
import Admin from './admin.js';
import * as ROUTES from './routes.js';

const App = () => (
  <Router>
    <div>
      <Header />

      <Route exact path={ROUTES.LANDING} component={Landing} />
      <Route path={ROUTES.PRACTICE} component={Practice} />
      {/*<Route path={ROUTES.LEARN} component={Learn} />
      <Route path={ROUTES.LEARN_MODULE} component={LearnModule} />*/}
      <Route path={ROUTES.PLAY} component={Play} />
      <Route path={ROUTES.SIGN_UP} component={SignUp} />
      <Route path={ROUTES.SIGN_IN} component={SignIn} />
      <Route path={ROUTES.PASSWORD_FORGET} component={PasswordForget} />
      <Route path={ROUTES.ACCOUNT} component={Account} />
      <Route path={ROUTES.ADMIN} component={Admin} />
    </div>
  </Router>
);

export default withAuthentication(App);
