import React from 'react';
import { Link } from 'react-router-dom';
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
      <h3>
        ABOUT US
      </h3>
      <p>
        We&apos;re simply a couple of Carnegie Mellon students trying to share
        our love for this simple yet amazingly challenging puzzle game!
        This course aims to teach beginners the basic techniques of Puyo Puyo
        so that they too can become Puyo Masters!
      </p>
      <h3>
        <a href="https://drive.google.com/file/d/11A7fWGeO1q_2VVteJDyTeuC-97ZQCJFU/view?usp=sharing">
          Syllabus
        </a>
      </h3>
    </div>

  </>
);

export default Landing;
