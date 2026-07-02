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
//redirectToGameSelection(_userName, _photoURL)
//Redirects the user to the game selection page 
//Called:   fb_signup() and fb_login() - after the user logs in/signs up
//Input:    _userName   - String - the user's user name
//          _photoURL   - String - link to the user's profile picture
//Return:   Change the html of the page to game selection
//--------------------------------------------
function redirectToGameSelection(_userName, _photoURL) {
    //checks if the user is on the banlist
    fb_checkBan()

    //changing HTML to the game selection page
    document.getElementById('body').innerHTML = `
                    <h1>Hello ` + _userName + `</h1><img src="` + _photoURL + `" id="profilePicture"><br>
                    <button onclick="window.location.href='planeGame/planeGame.html'">Plane Game</button><br>
                    <button onclick="window.location.href='geoDash/geoDash.html'">Geo Dash</button><br>
                    <button onclick="fb_readHighscore('geoDash')">Geo Dash Highscores</button><br>
                    <button onclick="fb_readHighscore('planeGame')">Plane Game Highscores</button>
                    <br><br><div id="output" style="background-color: #E5d4ed;padding-left: 25%;">`
}

//--------------------------------------------
//fb_signupHTML()
//Changes the page HTML to the signup form
//Called:   When the user tries to login without having an account
//Input:    N/A
//Return:   Changes the page HTML to the signup form
//--------------------------------------------
function fb_signupHTML() {
    //changing HTML to signup page
    document.getElementById('body').innerHTML = `
                    <h1>You havn't signed up yet,<br> please fill out this form to continue</h1><br><br>
                    <form id="loginForm">
                        <label for="userName">Please choose a username:<br>Note: Your username cannot include angle brackets, such as '>'</label><br>
                        <input type="text" id="userName" name="userName" maxlength="20" /><br><br>
                        <label for="age">How old are you</label><br>
                        <input type="number" id="age" name="age" max="250" min="13" required /><br>
                    </form>
                    <button onclick="fb_signup()" id="googleButton"><img src="Images/signUpWithGoogle.png" id="googleButtonImg"></button>`;
}

//--------------------------------------------
//fb_signup()
//Gets user input from the signup form, and writes them to the firebase - then calls redirectToGameSelection()
//Called:   When the user submits the signup form 
//Input:    userName    - String, user input taken from HTML form
//          age         - Numerical, user input taken from HTML form
//Return:   Writes user data to the database
//--------------------------------------------
function fb_signup() {
    //get user input form HTML form
    let userName = document.getElementById('userName').value.trim();
    let age = document.getElementById('age').value.trim();

    //validate the user input
    if(age == '' && userName == ''){
        alert('Please ensure you have filled out all input fields');
        return
    }

    if (userName.includes('<') || userName.includes('>')) {
        alert('You cannot have a username that includes < or >')
        return;
    } else if (age < 13) {
        alert('You must be at least 13 to sign up');
        return;
    }

    //checks the user has filled in fields, and passes data to the authenticate function
    if (age != '' && userName != '') {
        //set user data to variables - pulling data from session storage
        let uid = sessionStorage.getItem('uid')
        sessionStorage.setItem('userName', userName)
        let name = sessionStorage.getItem('name')
        let photoURL = sessionStorage.getItem('photoURL')
        let email = sessionStorage.getItem('email')
        let phoneNumber = sessionStorage.getItem('phoneNumber')

        //writes user data to their firebase profile
        firebase.database().ref('/userInfo/' + uid + '/userName').set(userName)
        firebase.database().ref('/userInfo/' + uid + '/uid').set(uid);
        firebase.database().ref('/userInfo/' + uid + '/name').set(name);
        firebase.database().ref('/userInfo/' + uid + '/photoURL').set(photoURL);
        firebase.database().ref('/userInfo/' + uid + '/email').set(email);
        firebase.database().ref('/userInfo/' + uid + '/phoneNumber').set(phoneNumber);
        firebase.database().ref('/userInfo/' + uid + '/age').set(age);

        //changing HTML to the game selection and highscore page
        redirectToGameSelection(userName, photoURL)

    } 
}

//--------------------------------------------
//fb_login(_uid)
//Reads the user's username and profile picture - If the user hasn't logged in before it detects it and calls fb_signup()
//Called:   fb_authenticate(), after the user has been authenticated
//Input:    _uid    - String, the user's uid, which is needed to read the user's data
//Return:   Calls redirectToGameSelection() if the user has logged in before
//          Calls fb_signupHTML() if the user hasn't logged in before
//--------------------------------------------
async function fb_login(_uid) {
    //reading user data to get username/profile picture
    let snapshot = await firebase.database().ref('/userInfo/' + _uid).once('value');
    let userInfo = snapshot.val()

    //checking to see if the user has signed up - if not redirect them to the signup page
    if (userInfo == null) {
        fb_signupHTML(_uid)
    } else {
        let userName = userInfo.userName;
        let photoURL = userInfo.photoURL;
        //changing HTML to the game selection and highscore page
        redirectToGameSelection(userName, photoURL)
    }
}

//--------------------------------------------
//fb_authenticate()
//Logs the user in with google in the database, and stores their data
//Called:   When the user presses the Login with google button on the landing page 
//Input:    N/A
//Return:   Signs the user in to firebase, stores their data in session storage, and calls fb_login()
//--------------------------------------------
async function fb_authenticate() {
    // authenticate with Google  - inital 5 lines (lines 140 to 146) 
    // from firebase documentation: https://firebase.google.com/docs/auth/web/google-signin#handle_the_sign-in_flow_with_the_firebase_sdk 
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

                //setting user data to session storage for later
                sessionStorage.setItem('uid', user.uid)
                sessionStorage.setItem('user', user)
                sessionStorage.setItem('name', user.displayName)
                sessionStorage.setItem('photoURL', user.photoURL)
                sessionStorage.setItem('email', user.email)
                sessionStorage.setItem('phoneNumber', user.phoneNumber)

                fb_login(user.uid)
            } else {
                //user not logged in
                loggedin = false;
                canLogIn = true;
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
    //get the user ID - needed for the firebase read/write
    let uid = sessionStorage.getItem('uid')

    //read the users username
    let snapshot = await firebase.database().ref('/userInfo/' + uid).once('value');
    let snapshotValue = snapshot.val();
    let userName = snapshotValue.userName;

    //read the users current highscore - if this is the users first time playing, their current highscore is 0
    let scoreSnapshot = await firebase.database().ref('/' + _gameName + 'Highscore/' + uid + '/score').once('value');
    let currentScore;
    //checks if the user has played before
    if (scoreSnapshot.exists()) {
        let scoreSnapshotValue = scoreSnapshot.val();
        currentScore = scoreSnapshotValue;
    } else {
        currentScore = 0;
    }

    //checks that the new score is actually a highscore - and then overwrites with the new highscore
    if (_score >= currentScore || currentScore == null) {
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
async function fb_checkBan() {
    let _userUID = sessionStorage.getItem('uid')
    //reads the banlist, 
    let snapshot = await firebase.database().ref('/banlist/' + _userUID).once('value');
    let banned = snapshot.val();

    //Checks if the user is on the banlist, if they are it prevetns login, and redirects them
    if (banned != null) {
        window.location.href = 'https://en.wikipedia.org/wiki/Hacker';
        return true;
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
    for (i = 0; i < 5 && i < highscoreTable.length; i++) {
        output.innerText += `\n` + highscoreTable[i].userName + `: ` + highscoreTable[i].score;
    }
}