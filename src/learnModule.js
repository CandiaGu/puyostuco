import React from 'react';
import { Link } from 'react-router-dom';
import { onLoadLearnModule, selectAndReloadModule } from './script';
import learnContent from './learnContent';
import * as ROUTES from './routes';

class LearnModule extends React.Component {
  componentDidMount() {
    onLoadLearnModule();
  }

  render() {
    return (
      <>
        {learnContent.map(({ title, subtitle, text }, i) => {
          const next = i < learnContent.length - 1 ? i + 1 : 0;
          const nextTitle = learnContent[next].title;
          return (
            <div key={title} className="learn-article-wrapper" id={`${title.toLowerCase()}-module`}>
              <div>
                <h2>{`${title}: ${subtitle}`}</h2>
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
                  to={ROUTES.LEARN_MODULE}
                  onClick={() => { selectAndReloadModule(nextTitle.toLowerCase()); }}
                >
                  next &gt;
                </Link>
                <div className="next-topic">
                  {`: ${nextTitle.toUpperCase()}`}
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
