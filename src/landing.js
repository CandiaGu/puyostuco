import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-dots-loader';
import { Link } from 'react-router-dom';
import { withFirebase } from './firebase.js';
import withAuthUser from './withAuthUser.js';
import * as ROUTES from './routes.js';
import { hwInfo } from './constants.js';

class Landing extends React.Component {
  constructor(props) {
    super(props);
    const {
      firebase,
    } = this.props;
    this.firebase = firebase;
    this.state = {};
  }

  static getDerivedStateFromProps(props, state) {
    const { authUser } = props;
    if (!!authUser && !state.authUser) {
      return {
        authUser,
        hwCompleted: null,
      };
    }
    return null;
  }

  componentDidMount() {
    this.loadHw();
  }

  componentDidUpdate() {
    this.loadHw();
  }

  componentWillUnmount() {
    if (this.hwRef) {
      this.hwRef.off('value');
    }
  }

  loadHw() {
    const {
      authUser,
      hwCompleted: oldHwCompleted,
    } = this.state;
    if (oldHwCompleted === null) {
      this.hwRef = this.firebase.user(authUser.uid).child('hw');
      this.hwRef.once('value', (snapshot) => {
        let hwCompleted = snapshot.val() || [];
        const numMissing = hwInfo.length - hwCompleted.length;
        if (numMissing > 0) {
          hwCompleted = hwCompleted.concat(Array(numMissing).fill(false));
          this.hwRef.set(hwCompleted);
        }
        this.setState({ hwCompleted });
      });
    }
  }

  render() {
    const {
      authUser,
      hwCompleted,
    } = this.state;
    return (
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
          <a href="https://drive.google.com/file/d/11A7fWGeO1q_2VVteJDyTeuC-97ZQCJFU/view?usp=sharing">
            <div className="sign-in-button" style={{ marginBottom: 50 }}>
              <h3 style={{ color: 'white' }}>
                  Syllabus
              </h3>
            </div>
          </a>
          {!!authUser && (
            <>
              <h3>
                ASSIGNMENTS
              </h3>
              {hwInfo.map(({ hwNum, infoText }, i) => (
                <div key={hwNum}>
                  <h4>
                    {`HW${hwNum}`}
                  </h4>
                  {infoText.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                  {hwCompleted ? (
                    <p className="completion-status">
                      {hwCompleted[i] ? 'Completed!' : 'Incomplete'}
                    </p>
                  ) : (
                    <Loader size={10} />
                  )}
                </div>
              ))}
            </>
          )}
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
            ACKNOWLEDGMENTS
          </h3>
          <p>
            Thanks to kar8uncle for the
            {' '}
            <a href="https://github.com/kar8uncle/carbuncle-widget">Carbuncle animation</a>
!
          </p>
        </div>

      </>
    );
  }
}

const {
  shape,
  func,
  string,
} = PropTypes;

Landing.propTypes = {
  firebase: shape({
    user: func.isRequired,
  }).isRequired,
  authUser: shape({
    uid: string.isRequired,
  }),
};

Landing.defaultProps = {
  authUser: undefined,
};

export default withFirebase(withAuthUser(Landing));
