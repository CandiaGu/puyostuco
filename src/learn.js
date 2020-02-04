import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-dots-loader';
import { withFirebase } from './firebase.js';
import { withAuthUser } from './session.js';
import Button from './button.js';
import Drill from './drill.js';

class Learn extends React.Component {
  constructor(props) {
    super(props);
    const {
      firebase,
    } = this.props;
    this.firebase = firebase;
    this.learnRef = this.firebase.ref().child('learn');
    this.drillNamesRef = this.learnRef.child('names');
    this.drillListsRef = this.learnRef.child('lists');
    this.state = {
      mode: 'none',
      lesson: 'none',
      drillNames: undefined,
      drillInfo: undefined,
    };
    this.history = [];
    this.completionLoaded = false;
    this.completionUpdated = false;
  }

  static getDerivedStateFromProps(props, state) {
    const { authUser } = props;
    if (!!authUser && !state.authUser) {
      return {
        ...state,
        authUser,
        completion: null,
      };
    }
    return null;
  }

  componentDidMount() {
    this.drillNamesRef.on('value', (snapshot) => {
      const drillNames = snapshot.val() || {};
      const { completion } = this.state;
      if (completion) {
        this.updateCompletion(drillNames, completion);
      }
      this.setState({ drillNames }, () => {
        if (completion && !this.completionUpdated) {
          this.completionUpdated = true;
          this.updateCompletion();
        }
      });
    });
    this.loadCompletion();
  }

  componentDidUpdate() {
    this.loadCompletion();
  }

  componentWillUnmount() {
    this.drillNamesRef.off('value');
    this.drillListsRef.off('value');
    if (this.completionRef) {
      this.completionRef.off('value');
    }
    if (this.hwRef) {
      this.hwRef.off('value');
    }
  }

  loadCompletion() {
    const {
      authUser,
      completion: oldCompletion,
    } = this.state;
    if (oldCompletion === null && !this.completionLoaded) {
      this.completionLoaded = true;
      this.userRef = this.firebase.user(authUser.uid);
      this.completionRef = this.userRef.child('learn');
      this.completionRef.on('value', (snapshot) => {
        const completion = snapshot.val() || {};
        this.setState({ completion }, () => {
          const { drillNames } = this.state;
          if (drillNames) {
            if (Object.keys(completion).length > 0) {
              for (const [lesson, names] of Object.entries(drillNames)) {
                if (Object.values(names).every((name) => completion[lesson][name])) {
                  this.completedLesson(lesson);
                }
              }
            }
            if (!this.completionUpdated) {
              this.completionUpdated = true;
              this.updateCompletion();
            }
          }
        });
      });
    }
  }

  updateCompletion() {
    const { drillNames, completion: oldCompletion } = this.state;
    const completion = JSON.parse(JSON.stringify(oldCompletion));
    let didUpdate = false;
    for (const lesson of Object.keys(drillNames)) {
      if (!(lesson in completion)) {
        completion[lesson] = {};
      }
      for (const name of Object.values(drillNames[lesson])) {
        if (!(name in completion[lesson])) {
          completion[lesson][name] = false;
          didUpdate = true;
        }
      }
    }
    if (didUpdate && this.completionRef) {
      this.completionRef.set(completion);
    }
  }

  completedLesson(lesson) {
    const hwNums = {
      stairs: 1,
      sandwich: 2,
    };
    if (lesson in hwNums) {
      const hwNum = hwNums[lesson];
      this.hwRef = this.userRef.child('hw');
      this.hwRef.once('value', (snapshot) => {
        const hwCompleted = snapshot.val();
        if (!hwCompleted[hwNum]) {
          window.alert(`HW${hwNum + 1} completed!`);
          hwCompleted[hwNum] = true;
          this.hwRef.set(hwCompleted);
        }
      });
    }
  }

  addLesson() {
    const lesson = window.prompt();
    if (lesson !== null) {
      this.drillNamesRef.child(lesson).set(0);
    }
  }

  deleteLesson(lessonName) {
    this.drillNamesRef.child(lessonName).remove();
    this.drillListsRef.child(lessonName).remove();
  }

  addDrill() {
    const { mode, lesson } = this.state;
    this.history.push({ mode, lesson });
    this.setState({ mode: 'game', drillInfo: null });
  }

  deleteDrill(key, name) {
    const { lesson } = this.state;
    this.drillNamesRef.child(lesson).child(key).remove();
    this.drillListsRef.child(lesson).child(name).remove();
  }

  runDrill(name) {
    const { mode, lesson } = this.state;
    this.history.push({ mode, lesson });
    this.drillName = name;
    this.drillListsRef.child(lesson).child(name).once('value', (snapshot) => {
      this.setState({ mode: 'game', drillInfo: snapshot.val() });
    });
  }

  endDrill(info) {
    const { lesson, drillInfo } = this.state;
    if (drillInfo === null) {
      const drillRef = this.drillListsRef.child(lesson).push(info);
      this.drillNamesRef.child(lesson).push(drillRef.key);
    } else {
      this.completedDrill();
    }
    this.setState(this.history.pop());
  }

  completedDrill() {
    const {
      lesson,
      completion: oldCompletion,
    } = this.state;
    const completion = JSON.parse(JSON.stringify(oldCompletion || {}));
    if (!(lesson in completion)) {
      completion[lesson] = {};
    }
    completion[lesson][this.drillName] = true;
    if (this.userRef) {
      this.completionRef.child(lesson).child(this.drillName).set(true);
    }
  }

  render() {
    const {
      mode,
      lesson,
      drillNames,
      drillInfo,
      completion,
    } = this.state;
    const { authUser } = this.props;
    let isAdmin = false;
    if (!!authUser && ['bney@andrew.cmu.edu', 'candi37@gmail.com'].includes(authUser.email)) {
      isAdmin = true;
    }
    let component = null;
    switch (mode) {
      case 'game':
        component = (
          <Drill
            drillInfo={drillInfo}
            endDrill={(info) => { this.endDrill(info); }}
          />
        );
        break;
      case 'drills':
        component = (
          <>
            {isAdmin && (
              <Button
                className="centered-box option learn-option"
                onClick={() => { this.addDrill(); }}
                text="+"
              />
            )}
            {Object.entries(drillNames[lesson] || {}).map(([key, name], i) => (
              <Button
                key={key}
                className="centered-box option learn-option"
                onClick={() => { this.runDrill(name); }}
                onDelete={() => { if (isAdmin) this.deleteDrill(key, name); }}
                text={
                  `${lesson.toUpperCase()} ${i}${
                    completion && lesson in completion && name in completion[lesson] ? (
                      completion[lesson][name] ? ' (complete)' : ' (incomplete)'
                    ) : ''
                  }`
                }
              />
            ))}
          </>
        );
        break;
      case 'none':
      default:
        component = (
          <>
            {isAdmin && (
              <Button
                className="centered-box option learn-option"
                onClick={() => { this.addLesson(); }}
                text="+"
              />
            )}
            {drillNames ? Object.entries(drillNames).map(([name, drills]) => (
              <Button
                key={name}
                className="centered-box option learn-option"
                onClick={() => {
                  this.history.push({ mode, lesson });
                  this.setState({ mode: 'drills', lesson: name });
                }}
                onDelete={() => { if (isAdmin) this.deleteLesson(name); }}
                text={`${name.toUpperCase()} (${Object.keys(drills).length})`}
              />
            )) : <Loader size={10} />}
          </>
        );
    }
    return (
      <>
        <div id="options">
          {component}

        </div>
        {mode === 'game' && (
          <div className="temp-controls">
          &#91;z/x or d/f&#93; to rotate | left/right arrow to move | down arrow to soft-drop
          </div>
        )}
        {mode !== 'none' && (
          <Button
            className="return"
            onClick={() => {
              this.setState(this.history.pop());
            }}
            text="RETURN"
          />
        )}

      </>
    );
  }
}

const {
  shape,
  func,
  string,
} = PropTypes;

Learn.propTypes = {
  firebase: shape({
    ref: func.isRequired,
    user: func.isRequired,
  }).isRequired,
  authUser: shape({
    uid: string.isRequired,
  }),
};

Learn.defaultProps = {
  authUser: undefined,
};

export default withFirebase(withAuthUser(Learn));
