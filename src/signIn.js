import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { SignUpLink } from './signUp.js';
import { PasswordForgetLink } from './passwordForget.js';
import { withFirebase } from './firebase.js';
import * as ROUTES from './routes.js';

const SignIn = () => (
  <div className="sign-in-form">
    <h1 style={{ marginTop: 0 }}>Sign In</h1>
    <SignInForm />
    <PasswordForgetLink />
    <SignUpLink />
  </div>
);

const INITIAL_STATE = {
  email: '',
  password: '',
  error: null,
};

class SignInFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }

  onSubmit = (event) => {
    const { email, password } = this.state;
    const { firebase, history } = this.props;
    firebase.doSignInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        history.push(ROUTES.LANDING);
      })
      .catch((error) => {
        this.setState({ error });
      });
    event.preventDefault(); // prevent reload
  };

  onChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { email, password, error } = this.state;
    const isInvalid = password === '' || email === '';
    return (
      <form onSubmit={this.onSubmit}>
        <h3>email</h3>
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="text"
          placeholder="Email Address"
          style={{ marginBottom: '5%' }}
        />
        <h3>password</h3>
        <input
          name="password"
          value={password}
          onChange={this.onChange}
          type="password"
          placeholder="Password"
          style={{ marginBottom: '5%' }}
        />
        <button disabled={isInvalid} type="submit" className="centered-box sign-in-button">
          SIGN IN
        </button>

        {error && <p>{error.message}</p>}
      </form>
    );
  }
}

const {
  shape,
  func,
} = PropTypes;

SignInFormBase.propTypes = {
  firebase: shape({
    doSignInWithEmailAndPassword: func.isRequired,
  }).isRequired,
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

const SignInLink = () => (
  <div>
    Already have an account?
    {' '}
    <Link to={ROUTES.SIGN_IN} className="click-link">Sign in</Link>
  </div>
);

const SignInForm = withRouter(withFirebase(SignInFormBase));

export default SignIn;

export { SignInForm, SignInLink };
