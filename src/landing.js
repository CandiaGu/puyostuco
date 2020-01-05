import React from 'react';
import { Link } from 'react-router-dom';
import Header from './header.js';
import * as ROUTES from './routes.js';

const Landing = () => (
  <>
    <Header page="landing" />

    <div className="home-container">
      <Link to={ROUTES.PLAY} className="box play">
        <div>
          <h2>
            PLAY
          </h2>
        </div>
      </Link>

      <Link to={ROUTES.LEARN} className="box learn">
        <div>
          <h2>
            LEARN
          </h2>
        </div>
      </Link>

      <Link to={ROUTES.PRACTICE} className="box practice">
        <div>
          <h2>
            PRACTICE
          </h2>
        </div>
      </Link>
    </div>


    <div className="about-us">
      <h2>
        ANNOUNCEMENT
      </h2>
      <p>
        Class hasn&apos;t started yet --- stayed tune until Spring 2020!
      </p>
    </div>
    <div className="about-us">
      <h3>
        ABOUT US
      </h3>
      <p>
        We&apos;re simply a couple of Carnegie Mellon students trying to share
        our love for this simple yet amazingly challenging puzzle game!
        This course aims to teach beginners the basic techniques of Puyo Puyo
        so that they too can become Puyo Masters!
      </p>
    </div>
  </>
);

export default Landing;
