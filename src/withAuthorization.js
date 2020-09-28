import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import AuthUserContext from './authUserContext.js';
import { firebaseAuthPropType, withFirebase } from './firebase.js';
import * as ROUTES from './routes.js';

const {
  shape,
  func,
} = PropTypes;

const withAuthorization = (condition) => (Component) => {
  class WithAuthorization extends React.Component {
    componentDidMount() {
      const { firebase, history } = this.props;
      this.listener = firebase.auth.onAuthStateChanged(
        (authUser) => {
          if (!condition(authUser)) {
            history.push(ROUTES.SIGN_IN);
          }
        },
      );
    }

    componentWillUnmount() {
      this.listener();
    }

    render() {
      return (
        <AuthUserContext.Consumer>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          {(authUser) => (condition(authUser) ? <Component {...this.props} /> : null)}
        </AuthUserContext.Consumer>
      );
    }
  }

  WithAuthorization.propTypes = {
    ...firebaseAuthPropType,
    history: shape({
      push: func.isRequired,
    }).isRequired,
  };

  return withRouter(withFirebase(WithAuthorization));
};

export default withAuthorization;
