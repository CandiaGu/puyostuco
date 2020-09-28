import React from 'react';
// import { PasswordForgetForm } from './passwordForget.js';
// import PasswordChangeForm from './passwordChange.js';
import AuthUserContext from './authUserContext.js';
import withAuthorization from './withAuthorization.js';

const Account = () => (
  <AuthUserContext.Consumer>
    {(authUser) => (
      <div>
        <h1>
Account:
          {authUser.email}
        </h1>
      </div>
    )}
  </AuthUserContext.Consumer>
);

const condition = (authUser) => !!authUser;

export default withAuthorization(condition)(Account);
