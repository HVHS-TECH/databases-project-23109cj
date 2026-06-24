/**************************************************************
 **************************************************************
 **                                                          **
 ** fb_io.js is where you will put common firebase functions **
 ** used throughout your code.                               **
 **                                                          **
 **************************************************************
 **************************************************************/
let canLogIn = true;

//--------------------------------------------
//fb_login()
//gets user input, and validates it before passing it to fb_authenticate
//Called:   When the user inputs their data, and presses the login with google button
//Input:    userName - text HTML input field 
//          age - numerical HTML input field
//Return:   N/A
//--------------------------------------------
function fb_login() {
    console.log('fb_login()')
    //get user input form HTML form
    let userName = document.getElementById('userName').value.trim();
    let age = document.getElementById('age').value.trim();

    //validate the user input
    if (userName.includes('<') || userName.includes('>')) {
        alert('You cannot have a username that includes < or >')
        return;
    } /*else if (age < 13) {
        alert('You have to be at least 13 to use this site');
        return;
    }*/

    //checks the user has filled in fields, and passes data to the authenticate function
    if (age != '' && userName != '') {
        fb_authenticate(userName, age)
    } else {
        alert('Please ensure you have filled out all input fields')
        return;
    }
}

//--------------------------------------------
//fb_authenticate(_userName, _age)
//Logs the user into firebase, signing them in with their google account.  
//Then scrapes a bunch of their data, and writes it to their firebase profile.
//Once logged in, changes HTML from the login page, to the game selection page.
//Called:   from fb_login(), once user input has been validated
//Input:    _userName - string, to be used in all communication with the user
//          _age - numerical value, 
//Return:   Writes user data to their profile on firebase. 
//--------------------------------------------

async function fb_authenticate(_userName, _age) {
    console.log('fb_authenticate()')
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

                //Gets user data, and stores uid and username in session storage for later access
                let uid = user.uid;
                sessionStorage.setItem('uid', uid)
                sessionStorage.setItem('userName', _userName)
                let name = user.displayName;
                let photoURL = user.photoURL;
                let email = user.email;
                let phoneNumber = user.phoneNumber;

                authentication();

                //checks user in not banned
                fb_checkBan(user.uid)

                //writes user data to their firebase profile
                console.log('starting write')
                firebase.database().ref('/userInfo/' + uid + '/userName').set(_userName)
                firebase.database().ref('/userInfo/' + uid + '/uid').set(uid);
                firebase.database().ref('/userInfo/' + uid + '/name').set(name);
                firebase.database().ref('/userInfo/' + uid + '/photoURL').set(photoURL);
                firebase.database().ref('/userInfo/' + uid + '/email').set(email);
                firebase.database().ref('/userInfo/' + uid + '/phoneNumber').set(phoneNumber);
                firebase.database().ref('/userInfo/' + uid + '/age').set(_age);

                //changing HTML to the game selection and highscore page
                document.getElementById('body').innerHTML = `<h1>Hello `+_userName+`</h1><img src="`+photoURL+`"><br>
                <button onclick="window.location.href='planeGame.html'">Plane Game</button><br>
                <button onclick="window.location.href='geoDash.html'">Geo Dash</button><br>
                <button onclick="fb_readHighscore('geoDash')">Geo Dash Highscores</button><br>
                <button onclick="fb_readHighscore('planeGame')">Plane Game Highscores</button>
                <br><br><div id="output" style="background-color: #E5d4ed;padding-left: 25%;">`


            } else {
                console.log('not logged in')
                loggedin = false;
                canLogIn = true;
                // User is signed out
            }
        });
    }
}

//--------------------------------------------
//fb_writeHighscore(_gameName, _score,)
//Checks if the users score in a game is greater than their previous score, 
// and if this is the case, updates their highscore on firebase
//Called:   When the user ends a game
//Input:    _gameName - string value, identifies which game the user is playing
//          _score - numerical value, the users current score in the game 
//Return:   If the user has achieved a new highscore, writes that to the highscoer branch of firebase, otherwise nothing
//--------------------------------------------
async function fb_writeHighscore(_gameName, _score,) {
    console.log('fb_writeHighscore()')

    //get the user ID - needed for the firebase read/write
    let uid = sessionStorage.getItem('uid')

    //read the users username
    let snapshot = await firebase.database().ref('/userInfo/' + uid).once('value');
    let snapshotValue = snapshot.val();
    let userName = snapshotValue.userName;

    //read the users current highscore - if this is the users first time playing, their current highscore is 0
    let scoreSnapshot = await firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').once('value');
    let currentScore;
    if (scoreSnapshot.exists()) {
        let scoreSnapshotValue = scoreSnapshot.val();
        currentScore = scoreSnapshotValue;
    } else {
        currentScore = 0;
    }

    //checks that the new score is actually a highscore - and then overwrites with the new highscore
    if (_score >= currentScore || currentScore == null) {
        console.log('writing')
        firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/userName').set(userName);
        firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').set(_score);
    }
}

//--------------------------------------------
//fb_checkBan(_userUID)
//Checks if the user is on the banlist, if they are, it returns true, and redirects them to the wikipedia page for hacker 
//Called:   In fb_authenticate()
//Input:    _userUID - the current user's UID
//Return:   Boolean
//--------------------------------------------
async function fb_checkBan(_userUID) {
    console.log('fb_checkBan()')
    //reads the banlist, 
    let snapshot = await firebase.database().ref('/banlist/' + _userUID).once('value');
    let banned = snapshot.val();
    //Checks if the user is on the banlist, if they are it prevetns login, and redirects them
    if (banned != null) {
        return true;
        window.location.href = 'https://en.wikipedia.org/wiki/Hacker';
    } else {
        return false;
    }
}

//--------------------------------------------
//fb_readHighscore(_gameName)
//Reads all user highscores, sorts them, and displays the top 5, along with the user's highscore
//Called:   When the user presses one of the Highscore table buttons
//Input:    _gameName - string, tells the function which branch of firebase highscores it is reading
//Return:   Displays the top 5 highscores, and the user's in the HTML
//--------------------------------------------
async function fb_readHighscore(_gameName) {
    console.log('fb_readHighscore()')
    //reads every users highscore for the game
    let snapshot = await firebase.database().ref('/' + _gameName + 'Highscore').once('value');
    let highscoreSnapshot = snapshot.val();
    let highscoreTable = [];
    let highscoreKeys = Object.values(highscoreSnapshot)

    //takes username, and their corrosponding highscore, and puts them together as an object in an array
    for (i = 0; i < highscoreKeys.length; i++) {
        let userKey = highscoreKeys[i].userName;
        let scoreKey = highscoreKeys[i].score;
        let userDetails = { 'userName': userKey, 'score': scoreKey }
        highscoreTable.push(userDetails)
    }
    //sorts the array on score, to get the alltime highscores
    highscoreTable.sort((a, b) => b.score - a.score)
    console.log(highscoreTable)

    //resets output area
    let output = document.getElementById('output');
    output.innerHTML = '';

    let uid = sessionStorage.getItem('uid')
    let userName = sessionStorage.getItem('userName')

    //reads the current user's highscore
    let currentUserSnapshot = await firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').once('value');
    let currentUserHighscore = currentUserSnapshot.val();

    //displays the user's highscore
    output.innerText = '\n\nYour Score: ' + currentUserHighscore + '\n\n The Top 5 Highscores are:\n';

    //displays the top 5 highscores from all players
    console.log(highscoreTable.length)
    for (i = 0; i < 5 && i < highscoreTable.length; i++) {
        output.innerText += `\n` + highscoreTable[i].userName + `: ` + highscoreTable[i].score;
    }
}