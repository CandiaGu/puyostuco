import React from 'react';
import { Link } from 'react-router-dom';
import { selectLearnModule } from './script.js';
import learnContent from './learnContent.js';
import * as ROUTES from './routes.js';

const Learn = () => (
  <>
    <div className="learn-module-wrapper">
      {learnContent.map(({ title }, i) => (
        <Link
          key={title}
          className={`learn-module learn-module-${i + 1} centered-box`}
          to={ROUTES.LEARN_MODULE}
          onClick={() => { selectLearnModule(title.toLowerCase()); }}
        >
          { title }
        </Link>
      ))}
    </div>
  </>
);

export default Learn;
