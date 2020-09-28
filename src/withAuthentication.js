import React from 'react';
import AuthUserContext from './authUserContext.js';
import { firebaseAuthPropType, withFirebase } from './firebase.js';

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
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...this.props} />
        </AuthUserContext.Provider>
      );
    }
  }

  WithAuthentication.propTypes = firebaseAuthPropType;

  return withFirebase(WithAuthentication);
};

export default withAuthentication;
