/**************************************************************
 **************************************************************
 **                                                          **
 ** fb_io.js is where you will put common firebase functions **
 ** used throughout your code.                               **
 **                                                          **
 **************************************************************
 **************************************************************/
let canLogIn = true;

function fb_login() {
    let userName = document.getElementById('userName').value.trim();
    let age = document.getElementById('age').value.trim();

    if (userName.includes('<') || userName.includes('>')) {
        alert('You cannot have a username that includes < or >')
        return;
    } else if (age < 13) {
        alert('You have to be at least 13 to use this site');
        return;
    }
    console.log(userName)
    console.log(age)
    if (age != '' && userName != '') {
        fb_authenticate(userName, age)
    } else {
        alert('Please ensure you have filled out all input fields')
        return;
    }
}

async function fb_authenticate(_userName, _age) {
    // authenticate with Google
    if (canLogIn) {
        var authentication = firebase.auth().onAuthStateChanged((user) => {

            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function (result) {
                // This gives you a Google Access Token.
                var token = result.credential.accessToken;
                // The signed-in user info.
                user = result.user;
            });
            if (user) {
                loggedin = true;
                canLogIn = false;

                console.log('loggedin')
                console.log(user)
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/v8/firebase.User
                let uid = user.uid;
                sessionStorage.setItem('uid', uid)
                sessionStorage.setItem('userName', _userName)
                let name = user.displayName;
                let photoURL = user.photoURL;
                let email = user.email;
                let phoneNumber = user.phoneNumber;

                authentication();

                fb_checkBan(user.uid)
                console.log('starting write')
                firebase.database().ref('/userInfo/' + uid + '/userName').set(_userName)
                firebase.database().ref('/userInfo/' + uid + '/uid').set(uid);
                firebase.database().ref('/userInfo/' + uid + '/name').set(name);
                firebase.database().ref('/userInfo/' + uid + '/photoURL').set(photoURL);
                firebase.database().ref('/userInfo/' + uid + '/email').set(email);
                firebase.database().ref('/userInfo/' + uid + '/phoneNumber').set(phoneNumber);
                firebase.database().ref('/userInfo/' + uid + '/age').set(_age);

                document.getElementById('body').innerHTML = `<img src="`+photoURL+`"><br>
                <button onclick="window.location.href='planeGame.html'">Plane Game</button><br>
                <button onclick="window.location.href='geoDash.html'">Geo Dash</button><br>
                <button onclick="fb_readHighscore('geoDash')">Geo Dash Highscores</button><br>
                <button onclick="fb_readHighscore('planeGame')">Plane Game Highscores</button>
                <br><br><div id="output">`


            } else {
                console.log('not logged in')
                loggedin = false;
                canLogIn = true;
                // User is signed out
            }
        });
    }
}

function fb_error() {
    // Don't forget your error handling!
}

async function fb_writeHighscore(_gameName, _score,) {
    let uid = sessionStorage.getItem('uid')
    console.log(uid)
    let snapshot = await firebase.database().ref('/userInfo/' + uid).once('value');
    let snapshotValue = snapshot.val();
    let userName = snapshotValue.userName;
    let scoreSnapshot = await firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').once('value');
    let currentScore;
    if (scoreSnapshot.exists()) {
        let scoreSnapshotValue = scoreSnapshot.val();
        currentScore = scoreSnapshotValue.score;
    } else {
        currentScore = 0;
    }
    if (_score >= currentScore || currentScore == null) {
        console.log('writing')
        firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/userName').set(userName);
        firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').set(_score);
    }
}

async function fb_checkBan(_userUID) {
    let snapshot = await firebase.database().ref('/banlist/' + _userUID).once('value');
    let banned = snapshot.val();
    if (banned != null) {
        return true;
        window.location.href = 'https://en.wikipedia.org/wiki/Hacker';
    } else {
        return false;
    }
}

async function fb_readHighscore(_gameName) {
    console.log('fb_readHighscore()')
    let snapshot = await firebase.database().ref('/' + _gameName + 'Highscore').once('value');
    let highscoreSnapshot = snapshot.val();
    let highscoreTable = [];
    let highscoreKeys = Object.values(highscoreSnapshot)

    for (i = 0; i < highscoreKeys.length; i++) {
        let userKey = highscoreKeys[i].userName;
        let scoreKey = highscoreKeys[i].score;
        let userDetails = { 'userName': userKey, 'score': scoreKey }

        highscoreTable.push(userDetails)
    }
    highscoreTable.sort((a, b) => b.score - a.score)
    console.log(highscoreTable)

    let output = document.getElementById('output');
    output.innerHTML = '';

    let uid = sessionStorage.getItem('uid')
    let userName = sessionStorage.getItem('userName')
    let currentUserSnapshot = await firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').once('value');
    let currentUserHighscore = currentUserSnapshot.val();
    output.innerText = 'Your Score: ' + currentUserHighscore + '\n\n The Top 5 Highscores are:\n';

    for (i = 0; i < 4 && i < highscoreTable.length; i++) {
        output.innerText += `\n` + highscoreTable[i].userName + `: ` + highscoreTable[i].score;
    }
}