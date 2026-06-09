{
  "rules": {
    ".read": false,
    ".write": false,
    "demoGameHighscore":{
        "$uid":{
          	".read":"auth.uid != null",
        		".write":"auth.uid == $uid && !root.child('banlist').child(auth.uid).exists()",
        },
    },
    "planeGameHighscore":{
        "$uid":{
          	".read":"auth.uid != null",
        		".write":"auth.uid == $uid && !root.child('banlist').child(auth.uid).exists()",
        },
    },
    "userInfo":{
        "$uid":{
          	".read":"auth.uid == $uid",
          	".write":"auth.uid == $uid",
				}
    }
  }
}