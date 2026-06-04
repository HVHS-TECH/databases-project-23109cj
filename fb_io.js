/**************************************************************
 **************************************************************
 **                                                          **
 ** fb_io.js is where you will put common firebase functions **
 ** used throughout your code.                               **
 **                                                          **
 **************************************************************
 **************************************************************/
function fb_authenticate(){
    // authenticate with Google
}

function fb_error(){
    // Don't forget your error handling!
}

function fb_writeHighscore(gameName, score, userName, uid){
    firebase.database().ref('/messages').set(gameName + score + userName + uid);

}