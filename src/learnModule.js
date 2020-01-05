import React from 'react';
import { Link } from 'react-router-dom';
import Header from './header.js';
import { onLoadLearnModule, selectAndReloadModule } from './script.js';
import learnContent from './learnContent.js';
import * as ROUTES from './routes.js';

class LearnModule extends React.Component {
  componentDidMount() {
    onLoadLearnModule();
  }

  render() {
    return (
      <>
        <Header page="learn-module" />
        {learnContent.map(({ title, subtitle, text }, i) => {
          const next = i < learnContent.length - 1 ? i + 1 : 0;
          const nextTitle = learnContent[next].title;
          return (
            <div key={title} className="learn-article-wrapper" id={title.toLowerCase() + '-module'}>
              <div>
                <h2>{title + ': ' + subtitle}</h2>
                <p>
                  {text.reduce((acc, x) => (acc === null ? x : (
                    <>
                      {acc}
                      {' '}
                      <br />
                      <br />
                      {' '}
                      {x}
                    </>
                  )), null)}
                </p>
                <Link
                  className="next centered-box"
                  to={ROUTES.LEARNMODULE}
                  onClick={() => { selectAndReloadModule(nextTitle.toLowerCase()); }}
                >
                  next &gt;
                </Link>
                <div className="next-topic">
                  {': ' + nextTitle.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }
}

export default LearnModule;
