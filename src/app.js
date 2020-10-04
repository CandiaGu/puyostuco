import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import withAuthentication from './withAuthentication';
import Header from './header';
import Landing from './landing';
import Practice from './practice';
import Learn from './learn';
import LearnModule from './learnModule';
import Play from './play';
import SignUp from './signUp';
import SignIn from './signIn';
import PasswordForget from './passwordForget';
import Account from './account';
import Admin from './admin';
import * as ROUTES from './routes';
import Carbuncle from './carbuncle';

const App = () => (
  <Router>
    <div>
      <Route exact path={ROUTES.LANDING}>
        {({ match }) => (
          <div style={{ visibility: match ? 'visible' : 'hidden' }}>
            <Carbuncle />
          </div>
        )}
      </Route>

      <Header />

      <Route exact path={ROUTES.LANDING} component={Landing} />
      <Route path={ROUTES.PRACTICE} component={Practice} />
      <Route path={ROUTES.LEARN} component={Learn} />
      <Route path={ROUTES.LEARN_MODULE} component={LearnModule} />
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
