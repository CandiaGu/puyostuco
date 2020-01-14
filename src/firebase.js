import React from 'react';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const config = {
  production: {
    apiKey: 'AIzaSyBfL5Tw5FzRhqgrYIfSl1-ZIHEWQ2-nUK0',
    authDomain: 'puyostuco.firebaseapp.com',
    databaseURL: 'https://puyostuco.firebaseio.com',
    projectId: 'puyostuco',
    storageBucket: 'puyostuco.appspot.com',
    messagingSenderId: '249504518298',
    appId: '1:249504518298:web:6e704b68850c969785cf23',
  },
  development: {
    apiKey: "AIzaSyBCfi9IWP7McUAzYQnLZg1S1h2E50ZfG5M",
    authDomain: "puyostuco-dev.firebaseapp.com",
    databaseURL: "https://puyostuco-dev.firebaseio.com",
    projectId: "puyostuco-dev",
    storageBucket: "puyostuco-dev.appspot.com",
    messagingSenderId: "971124865987",
    appId: "1:971124865987:web:0f1a1f796b209a25df9b76",
  },
};

class Firebase {
  constructor() {
    app.initializeApp(config[process.env.NODE_ENV]);
    this.auth = app.auth();
    this.db = app.database();
  }

  ref = () => this.db.ref();

  // Auth API
  doCreateUserWithEmailAndPassword = (email, password) => (
    this.auth.createUserWithEmailAndPassword(email, password)
  );

  doSignInWithEmailAndPassword = (email, password) => (
    this.auth.signInWithEmailAndPassword(email, password)
  );

  doSignOut = () => this.auth.signOut();

  doPasswordReset = (email) => this.auth.sendPasswordResetEmail(email);

  doPasswordUpdate = (password) => this.auth.currentUser.updatePassword(password);

  // User API
  user = (uid) => this.db.ref(`users/${uid}`);

  users = () => this.db.ref('users');
}

const FirebaseContext = React.createContext(null);

const withFirebase = (Component) => (props) => (
  <FirebaseContext.Consumer>
    {(firebase) => <Component {...props} firebase={firebase} />}
  </FirebaseContext.Consumer>
);

export default Firebase;

export { FirebaseContext, withFirebase };
