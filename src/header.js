import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import SignOutButton from './signOut';
import AuthUserContext from './authUserContext';
import * as ROUTES from './routes';

const AccountBox = () => (
  <AuthUserContext.Consumer>
    {(authUser) => (
      <div className="centered-box sign-in-up">
        {authUser ? (
          <>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link to={ROUTES.SIGN_IN} className="sign-in">
              sign in
            </Link>
            <Link to={ROUTES.SIGN_UP} className="sign-up">
              sign up
            </Link>
          </>
        )}
      </div>
    )}
  </AuthUserContext.Consumer>
);

const Header = ({ location }) => {
  const path = location.pathname.split('/')[1];
  let page;
  switch (path) {
    case '': page = 'landing'; break;
    case 'signin':
    case 'signup':
    case 'pw-forget': page = 'registration'; break;
    default: page = path;
  }
  let headerStyle = 'other';
  if (page === 'landing') headerStyle = 'home';
  else if (page === 'registration') headerStyle = 'reg';
  return (
    <header className={`${headerStyle}-header`}>

      {page === 'landing'
        && (
          <div className="centered-box">
            <h2>
              98-364
              <br />
              SPRING 2020
            </h2>
          </div>
        )}

      <div className="centered-box">
        <Link to={ROUTES.LANDING} className="puyo-box centered-box">
          <h1>
            puyo puyo
            <br />
            <div style={{ fontSize: '150%' }}>
              STUCO
            </div>
            <div className="centered-box">
              <span className="dot" style={{ backgroundColor: 'green' }} />
              <span className="dot" style={{ backgroundColor: 'red' }} />
              <span className="dot" style={{ backgroundColor: 'orange' }} />
              <span className="dot" style={{ backgroundColor: 'blue' }} />
              <span className="dot" style={{ backgroundColor: 'purple' }} />
            </div>
          </h1>
        </Link>

        {page !== 'landing' && page !== 'registration'
          && (page === 'learn-module' ? (
            <Link className="learn-header-extension centered-box" to={ROUTES.LEARN}>
              LEARN
            </Link>
          ) : (
            <div className={`${page}-header-extension centered-box`}>
              { page.toUpperCase() }
            </div>
          ))}

      </div>
      {page !== 'registration'
      && (<AccountBox />)}

    </header>
  );
};

const {
  shape,
  string,
} = PropTypes;

Header.propTypes = {
  location: shape({
    pathname: string.isRequired,
  }).isRequired,
};

export default withRouter(Header);
