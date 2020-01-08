import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { withFirebase } from './firebase.js';
import * as ROUTES from './routes.js';

const AuthUserContext = React.createContext(null);

const {
  shape,
  func,
} = PropTypes;

const firebaseAuthPropType = {
  firebase: shape({
    auth: shape({
      onAuthStateChanged: func.isRequired,
    }).isRequired,
  }).isRequired,
};

const withAuthentication = (Component) => {
  class WithAuthentication extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        authUser: null,
      };
    }

    componentDidMount() {
      const { firebase } = this.props;
      this.listener = firebase.auth.onAuthStateChanged((authUser) => {
        if (authUser) {
          this.setState({ authUser });
        } else {
          this.setState({ authUser: null });
        }
      });
    }

    componentWillUnmount() {
      this.listener();
    }

    render() {
      const { authUser } = this.state;
      return (
        <AuthUserContext.Provider value={authUser}>
          <Component {...this.props} />
        </AuthUserContext.Provider>
      );
    }
  }

  WithAuthentication.propTypes = firebaseAuthPropType;

  return withFirebase(WithAuthentication);
};

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

const withAuthUser = (Component) => (props) => (
  <AuthUserContext.Consumer>
    {(authUser) => <Component {...props} authUser={authUser} />}
  </AuthUserContext.Consumer>
);

export {
  AuthUserContext,
  withAuthentication,
  withAuthorization,
  withAuthUser,
};
