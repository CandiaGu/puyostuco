import React from 'react';
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import * as ROUTES from './routes.js';

const Landing = () => (
  <>
    <div className="home-container">
      <Link to={ROUTES.PLAY} className="box play">
        <div>
          <h2>
            PLAY
          </h2>
        </div>
      </Link>

      <Link to={ROUTES.LEARN} className="box learn disabled-link">
        <div>

          <h2>
            <FaLock />
            {' '}
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
      <a href="https://drive.google.com/file/d/11A7fWGeO1q_2VVteJDyTeuC-97ZQCJFU/view?usp=sharing">
        <div className="sign-in-button" style={{ marginBottom: 50 }}>
          <h3 style={{ color: 'white' }}>
              Syllabus
          </h3>
        </div>
      </a>
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
