/**************************************************************/
// fb_initialise()
// Initialize firebase, connect to the Firebase project.
// 
// Find the config data in the Firebase console. Cog wheel > Project Settings > General > Your Apps > SDK setup and configuration > Config
//
// Input:  n/a
// Return: n/a
/**************************************************************/
  const firebaseConfig = {
    apiKey: "AIzaSyC6kkIVTM1JBtxL0ZHdkr6cMJgD8Te24iA",
    authDomain: "comp-2026-cameron-johns.firebaseapp.com",
    databaseURL: "https://comp-2026-cameron-johns-default-rtdb.firebaseio.com",
    projectId: "comp-2026-cameron-johns",
    storageBucket: "comp-2026-cameron-johns.firebasestorage.app",
    messagingSenderId: "126922126250",
    appId: "1:126922126250:web:bf7ec34b7e95b888aff1d3"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
