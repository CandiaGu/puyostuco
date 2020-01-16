import React from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';
import { withAuthUser } from './session.js';
import GameSingle from './gameSingle.js';

class Challenge extends React.Component {
  constructor(props) {
    super(props);
    const { firebase, authUser } = this.props;
    if (!!authUser) {
      this.userRef = firebase.user(authUser.uid);
    }
  }

  render() {
    return (
      <GameSingle
        challenge="score"
        userRef={this.userRef}
      />
    );
  }
}

const {
  shape,
  func,
  string,
} = PropTypes;

Challenge.propTypes = {
  firebase: shape({
    user: func.isRequired,
  }).isRequired,
  authUser: shape({
    uid: string.isRequired,
  }),
};

Challenge.defaultProps = {
  authUser: undefined,
};

export default withAuthUser(withFirebase(Challenge));
