/**************************************************************
 **************************************************************
 **                                                          **
 ** fb_io.js is where you will put common firebase functions **
 ** used throughout your code.                               **
 **                                                          **
 **************************************************************
 **************************************************************/
var canLogIn = true;

function fb_login(){
    let userName = document.getElementById('userName').value.trim();
    let age = document.getElementById('age').value.trim();

    if(age != null && userName != null){
        fb_authenticate(userName, age)
    } else{
        alert('Please ensure you have filled out all input fields')
    }
}

function fb_authenticate(_userName, _age){
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
                let name = user.displayName;
                let photoURL = user.photoURL;
                let email = user.email;
                let phoneNumber = user.phoneNumber;

                //document.getElementById('login').innerHTML = ``;
                //document.getElementById('logout').innerHTML = `<button onclick="fb_logout()">Logout</button>`;
                authentication();
                
                firebase.database().ref('/userInfo/' + uid + '/userName').set(_userName)
                firebase.database().ref('/userInfo/' + uid + '/uid').set(uid);
                firebase.database().ref('/userInfo/' + uid + '/name').set(name);
                firebase.database().ref('/userInfo/' + uid + '/photoURL').set(photoURL);
                firebase.database().ref('/userInfo/' + uid + '/email').set(email);
                firebase.database().ref('/userInfo/' + uid + '/phoneNumber').set(phoneNumber);
                firebase.database().ref('/userInfo/' + uid + '/age').set(_age);



                fb_checkBan(user.uid)

            } else {
                console.log('not logged in')
                loggedin = false;
                canLogIn = true;
                // User is signed out
                // ...
            }
        });
    }
}

function fb_error(){
    // Don't forget your error handling!
}

function fb_writeHighscore(gameName, score, userName, uid){
    firebase.database().ref('/messages').set(gameName + score + userName + uid);

}

async function fb_checkBan(_userUID) {
    let snapshot = await firebase.database().ref('/banList/' + _userUID).once('value');
    let banned = snapshot.val();
    if (banned != null) {
        return true;
        window.location.href = 'https://en.wikipedia.org/wiki/Hacker';
    } else{
        return false;
    }
}