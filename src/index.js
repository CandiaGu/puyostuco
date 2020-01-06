import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import App from './app.js';
import Firebase, { FirebaseContext } from './firebase.js';

ReactDOM.render((
  <FirebaseContext.Provider value={new Firebase()}>
    <App />
  </FirebaseContext.Provider>
),
document.getElementById('root'));
