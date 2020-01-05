import React from 'react';
import { Link } from 'react-router-dom';
import Header from './header.js';
import { selectLearnModule } from './script.js';
import learnContent from './learnContent.js';
import * as ROUTES from './routes.js';

const Learn = () => (
  <>
    <Header page="learn" />
    <div className="learn-module-wrapper">
      {learnContent.map(({ title }, i) => (
        <Link
          key={title}
          className={'learn-module learn-module-' + (i + 1) + ' centered-box'}
          to={ROUTES.LEARNMODULE}
          onClick={() => { selectLearnModule(title.toLowerCase()); }}
        >
          { title }
        </Link>
      ))}
    </div>
  </>
);

export default Learn;
