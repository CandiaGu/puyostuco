import React from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';

const SignOutButton = ({ firebase }) => (
  <button type="button" onClick={firebase.doSignOut}>
    sign out
  </button>
);

const {
  shape,
  func,
} = PropTypes;

SignOutButton.propTypes = {
  firebase: shape({
    doSignOut: func.isRequired,
  }).isRequired,
};

export default withFirebase(SignOutButton);
