import React from 'react';
import PropTypes from 'prop-types';
import {
  Switch,
  Route,
  Link,
  useRouteMatch,
} from 'react-router-dom';
import withAuthUser from './withAuthUser';
import GameSingle from './gameSingle';
import Highscores from './highscores';
import { PRACTICE_ROUTES as ROUTES } from './routes';

const Practice = ({ authUser }) => {
  const { path, url } = useRouteMatch();
  return (
    <div id="options">
      <Switch>
        <Route path={`${path}${ROUTES.GAME}${ROUTES.CHALLENGE_PARAM}?`}>
          <GameSingle />
        </Route>
        <Route path={`${path}${ROUTES.HIGHSCORES}${ROUTES.CHALLENGE_PARAM}`}>
          <Highscores />
        </Route>
        <Route path={`${path}${ROUTES.HIGHSCORES}`}>
          <Link
            className="centered-box option practice-option"
            to={`${url}${ROUTES.HIGHSCORES}${ROUTES.SCORE}`}
          >
            <h2>
              SCORE CHALLENGE HIGHSCORES
            </h2>
          </Link>
        </Route>
        <Route path={`${path}${ROUTES.CHALLENGE}`}>
          <Link
            className="centered-box option practice-option"
            to={`${url}${ROUTES.GAME}${ROUTES.SCORE}`}
          >
            <h2>
              SCORE CHALLENGE
            </h2>
          </Link>
          {!!authUser && (
            <Link
              className="centered-box option practice-option"
              // '/score' to bypass next page
              to={`${url}${ROUTES.HIGHSCORES}${ROUTES.SCORE}`}
            >
              <h2>
                HIGHSCORES
              </h2>
            </Link>
          )}
        </Route>
        <Route path={path}>
          <Link className="centered-box option practice-option" to={`${url}${ROUTES.GAME}`}>
            <h2>
              SOLO
            </h2>
          </Link>
          <Link className="centered-box option practice-option" to={`${url}${ROUTES.CHALLENGE}`}>
            <h2>
              CHALLENGE
            </h2>
          </Link>
        </Route>
      </Switch>
    </div>
  );
};

const {
  shape,
  string,
} = PropTypes;

Practice.propTypes = {
  authUser: shape({
    uid: string.isRequired,
  }),
};

Practice.defaultProps = {
  authUser: undefined,
};

export default withAuthUser(Practice);
