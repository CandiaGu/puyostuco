import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as ROUTES from './routes.js';

const Header = ({ page }) => (
  <header className={(page === 'landing' ? 'home' : 'other') + '-header'}>

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

      {page !== 'landing'
        && (page === 'learn-module' ? (
          <Link className="learn-header-extension centered-box" to={ROUTES.LEARN}>
            LEARN
          </Link>
        ) : (
          <div className={page + '-header-extension centered-box'}>
            { page.toUpperCase() }
          </div>
        ))}

    </div>

    <div className="centered-box sign-in-up">
      <Link to={ROUTES.LANDING} className="sign-in">
        sign in
      </Link>
      <Link to={ROUTES.LANDING} className="sign-up">
        sign up
      </Link>
    </div>

  </header>
);

const { string } = PropTypes;

Header.propTypes = { page: string.isRequired };

export default Header;
