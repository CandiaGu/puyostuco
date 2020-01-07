import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withFirebase } from './firebase.js';
import * as ROUTES from './routes.js';

const PasswordForget = () => (
  <div className="sign-in-form">
    <h1>I forgot my password :(</h1>
    <PasswordForgetForm />
  </div>
);

const INITIAL_STATE = {
  email: '',
  error: null,
  passwordReset: false,
};

class PasswordForgetFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }

  onSubmit = (event) => {
    const { email } = this.state;
    const { firebase } = this.props;
    firebase.doPasswordReset(email)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
      })
      .catch((error) => {
        this.setState({ error });
      });
    event.preventDefault(); // prevent reload
    this.setState({passwordReset: true});
  };

  onChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { email, error } = this.state;
    const isInvalid = email === '';
    return (
      <div style={{width:'100%'}}>
        {!this.state.passwordReset ? 
        <form onSubmit={this.onSubmit}>
          <h3>email</h3>
          <input
            name="email"
            value={email}
            onChange={this.onChange}
            type="text"
            placeholder="Email Address"
          />
          <button disabled={isInvalid} type="submit" className="centered-box sign-in-button">
            Reset My Password
          </button>

          {error && <p>{error.message}</p>}
        </form>
        :
        <div>
          <h2>Your password was reset!</h2>
          Please check your email for further instructions :-)
        </div>
        }
      </div>
    );
  }
}

const {
  shape,
  func,
} = PropTypes;

PasswordForgetFormBase.propTypes = {
  firebase: shape({
    doPasswordReset: func.isRequired,
  }).isRequired,
};

const PasswordForgetLink = () => (
  <p>
    <Link className="click-link" to={ROUTES.PASSWORD_FORGET}>Forgot Password?</Link>
  </p>
);

export default PasswordForget;

const PasswordForgetForm = withFirebase(PasswordForgetFormBase);

export { PasswordForgetForm, PasswordForgetLink };
