import firebase from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBfL5Tw5FzRhqgrYIfSl1-ZIHEWQ2-nUK0',
  authDomain: 'puyostuco.firebaseapp.com',
  databaseURL: 'https://puyostuco.firebaseio.com',
  projectId: 'puyostuco',
  storageBucket: 'puyostuco.appspot.com',
  messagingSenderId: '249504518298',
  appId: '1:249504518298:web:6e704b68850c969785cf23',
};

firebase.initializeApp(firebaseConfig);

export default firebase;
