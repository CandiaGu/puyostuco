import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { withFirebase } from './firebase.js';
import * as ROUTES from './routes.js';

const SignUp = () => (
  <div className="sign-in-form" style = {{marginBottom: '5%'}}>
    <h1 style={{marginTop: 0}}>Sign Up</h1>
    <SignUpForm />
  </div>
);

const INITIAL_STATE = {
  username: '',
  email: '',
  passwordOne: '',
  passwordTwo: '',
  error: null,
};

class SignUpFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }

  onSubmit = (event) => {
    const { username, email, passwordOne } = this.state;
    const { firebase, history } = this.props;
    firebase.doCreateUserWithEmailAndPassword(email, passwordOne)
      .then((authUser) => firebase.user(authUser.user.uid)
        .set({
          username,
          email,
        }))
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
    const {
      username,
      email,
      passwordOne,
      passwordTwo,
      error,
    } = this.state;

    const isInvalid = (
      passwordOne !== passwordTwo
      || passwordOne === ''
      || email === ''
      || username === ''
    );

    return (
      <form onSubmit={this.onSubmit}>
        <h3>username</h3>
        <input
          name="username"
          value={username}
          onChange={this.onChange}
          type="text"
          placeholder="Username"
          style={{marginBottom: '5%'}}
        />
        <h3>email</h3>
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="text"
          placeholder="Email Address"
          style={{marginBottom: '5%'}}
        />
        <h3>password</h3>
        <input
          name="passwordOne"
          value={passwordOne}
          onChange={this.onChange}
          type="password"
          placeholder="Password"
        />
        <input
          name="passwordTwo"
          value={passwordTwo}
          onChange={this.onChange}
          type="password"
          placeholder="Confirm Password"
          style={{marginBottom: '5%'}}
        />
        <button disabled={isInvalid} type="submit" className="centered-box sign-in-button">
          SIGN UP
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

SignUpFormBase.propTypes = {
  firebase: shape({
    doCreateUserWithEmailAndPassword: func.isRequired,
    user: func.isRequired,
  }).isRequired,
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

const SignUpLink = () => (
  <div>
    Don&apos;t have an account?
    {' '}
    <Link to={ROUTES.SIGN_UP} className="click-link">Sign Up</Link>
  </div>
);

const SignUpForm = withRouter(withFirebase(SignUpFormBase));

export default SignUp;

export { SignUpForm, SignUpLink };
