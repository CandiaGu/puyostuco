import React from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';
import { withAuthUser } from './session.js';
import GameSingle from './gameSingle.js';
import Button from './button.js';
import Drill from './drill.js';

class Learn extends React.Component {
  constructor(props) {
    super(props);
    const {
      firebase,
    } = this.props;
    this.learnRef = firebase.ref().child('learn');
    this.drillNamesRef = this.learnRef.child('names');
    this.drillListsRef = this.learnRef.child('lists');
    this.state = {
      mode: 'none',
      lesson: 'none',
      drillNames: {},
      drillInfo: undefined,
      drillCompletion: [],
    };
    this.history = [];
  }

  componentDidMount() {
    this.drillNamesRef.on('value', (snapshot) => {
      const drillNames = snapshot.val();
      this.setState({
        drillNames: drillNames || {},
      });
    });
  }

  componentWillUnmount() {
    this.drillNamesRef.off('value');
  }

  addLesson() {
    const lesson = window.prompt();
    if (!!lesson) {
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
    this.setState(({ drillCompletion: oldDrillCompletion }) => {
      const drillCompletion = { ...oldDrillCompletion };
      delete drillCompletion[name];
      return { drillCompletion };
    });
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
    console.log('passed', this.drillName);
    const { drillCompletion: { [this.drillName]: completed } } = this.state;
    if (!completed) {
      this.setState(({ drillCompletion }) => ({
        drillCompletion: { ...drillCompletion, [this.drillName]: true },
      }));
    }
  }

  render() {
    const {
      mode,
      lesson,
      drillNames,
      drillInfo,
      drillCompletion,
    } = this.state;
    const { firebase, authUser } = this.props;
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
                text={`${lesson.toUpperCase()} ${i} (${drillCompletion[name] ? '' : 'in'}complete)`}
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
            {Object.entries(drillNames).map(([name, drills]) => (
              <Button
                key={name}
                className="centered-box option learn-option"
                onClick={() => {
                  this.history.push({ mode, lesson });
                  this.setState({ mode: 'drills', lesson: name, drillCompletion: Object.fromEntries(Object.values(drillNames[name]).map((drill) => [drill, false])) });
                }}
                onDelete={() => { if (isAdmin) this.deleteLesson(name); }}
                text={`${name.toUpperCase()} (${Object.keys(drills).length})`}
              />
            ))}
          </>
        );
    }
    return (
      <>
        <div id="options">
          {component}

        </div>
        {mode == 'game' && (
          <div className="temp-controls">
          &#91;z/x or d/f&#93; to rotate | left/right arrow to move | down arrow to soft-drop
          </div>
          )
        }
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
} = PropTypes;

Learn.propTypes = {
  firebase: shape({
    ref: func.isRequired,
  }).isRequired,
};

export default withFirebase(withAuthUser(Learn));
