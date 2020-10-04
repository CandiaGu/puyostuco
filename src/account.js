import React from 'react';
// import { PasswordForgetForm } from './passwordForget';
// import PasswordChangeForm from './passwordChange';
import AuthUserContext from './authUserContext';
import withAuthorization from './withAuthorization';

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
