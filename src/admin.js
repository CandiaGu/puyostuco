import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';
import { withAuthorization } from './session.js';

class Admin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      users: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    const { firebase } = this.props;
    firebase.users().on('value', (snapshot) => {
      if (!snapshot.exists()) return;
      const usersObject = snapshot.val();
      const usersList = Object.keys(usersObject).map((key) => ({
        ...usersObject[key],
        uid: key,
      }));
      this.setState({
        users: usersList,
        loading: false,
      });
    });
  }

  componentWillUnmount() {
    const { firebase } = this.props;
    firebase.users().off();
  }

  render() {
    const { users, loading } = this.state;
    return (
      <div>
        <h1>Admin</h1>
        {loading && <div>Loading...</div>}
        <UserList users={users} />
      </div>
    );
  }
}

const UserList = ({ users }) => (
  <ul>
    {users.map((user) => (
      <li key={user.uid}>
        <span>
          <strong>ID:</strong>
          {' '}
          {user.uid}
        </span>
        <span>
          <strong> E-mail:</strong>
          {' '}
          {user.email}
        </span>
        <span>
          <strong> Username:</strong>
          {' '}
          {user.username}
        </span>
      </li>
    ))}
  </ul>
);

const {
  arrayOf,
  shape,
  string,
  func,
} = PropTypes;

const usersPropType = arrayOf(shape({
  uid: string.isRequired,
  email: string.isRequired,
  username: string.isRequired,
}));

Admin.propTypes = {
  firebase: shape({
    users: func.isRequired,
  }).isRequired,
};

UserList.propTypes = {
  users: usersPropType.isRequired,
};

const condition = (authUser) => (
  authUser && ['bney@andrew.cmu.edu', 'candi37@gmail.com'].includes(authUser.email)
);

export default withAuthorization(condition)(withFirebase(Admin));
