import React from 'react';
import AuthUserContext from './authUserContext.js';

const withAuthUser = (Component) => (props) => (
  <AuthUserContext.Consumer>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    {(authUser) => <Component {...props} authUser={authUser} />}
  </AuthUserContext.Consumer>
);

export default withAuthUser;
