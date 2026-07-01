console.log("planeGame.js")

//defining variables 
let gameState = "menu";
let throttle = 0.5;
let pitch = 0;
let cnv;
let missileTimer = 0;
let missile;
let score = 0;
let enemyTimer = 500;
let enemyGroup;
let particleGroup;
let enemyMissile;
let enemyMissileExists = false;
let gameRunning = true;
let chaffRemaining = 150;
let chaffGroup;
let enemyAttack = 0;

const GRAVITY = 0.15;
const LIFTCOEFFICENT = 0.3025;
const FRAMERATE = 60;
const PITCHSENSITIVITY = 0.22;
let groundHeight;       //as var so it can be read from all functions - value never changed after setup()
let screenWidth;        //as var so it can be read from all functions - value never changed after setup()
let screenHeight;       //as var so it can be read from all functions - value never changed after setup()


//plane img source = https://upload.wikimedia.org/wikipedia/commons/9/93/A-7_Corsair_II.svg   -- Is creative commons - found by filtering google for creative commons only
//enemy img source = https://upload.wikimedia.org/wikipedia/commons/5/5a/F14_2_Wiki.jpg   -- Is creative commons - found by filtering google for creative commons only
//missile img source = https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHKue8u9AK_9maZw1459bZeo7c7QBAammykw&s   -- Is creative commons - found by filtering google for creative commons only
//cloud img source = https://upload.wikimedia.org/wikipedia/commons/7/7e/Cloud_PNG_Image.png

function preload() {
    console.log('preload()')
    //loading images
    imgPlane = loadImage('../Images/A-7.svg');
    imgCloud = loadImage('../Images/Cloud.png');
    imgMissile = loadImage('../Images/missile.png');
    imgEnemy = loadImage('../Images/F-14.png');
}

function setup() {
    console.log('setup()')
    //defining constants that require a P5 function to work - have to be initalised at begining to be global 
    frameRate(FRAMERATE)
    screenHeight = windowHeight;
    screenWidth = windowWidth
    groundHeight = screenHeight - screenHeight / 6;

    cnv = new Canvas(screenWidth, screenHeight);

    //creating cloud
    cloud = new Sprite(screenWidth, random(0, groundHeight), 10, 10, 'n')
    cloud.image = (imgCloud);
    cloud.image.scale = 0.5;

    //creating player plane
    plane = new Sprite(screenWidth / 6, groundHeight, 80, 30, 'd');
    plane.image = (imgPlane);
    plane.image.scale.y = 0.1;
    plane.image.scale.x = -0.1;
    plane.bouncieness = 0;

    //creating ground
    ground = new Sprite(screenWidth / 2, groundHeight / 3 * 4.35, screenWidth * 2, groundHeight, 'k');
    ground.color = '#00ff00';
    ground.bouncieness = 0;

    //creating Roof/wall at top of game
    wallTop = new Sprite(screenWidth / 2, screenHeight / 2 - screenHeight, screenWidth, 5, 'k')
    wallTop.visible = false;

    //creating groups - already defined to be global
    enemyGroup = new Group()
    particleGroup = new Group()
    chaffGroup = new Group()
}

//--------------------------------------------
//createEnemy(_playerX, _playerY)
//Creates an enemy plane 
//Called:   In the draw loop - every 500 frames
//Input:    _playerX - numerical value - lets the enemy spawn a constant distance from the players X
//          _playerY - numerical value - lets the enemy spawn at the same height as the player
//Return:   Creates an enemy at the left edge of the screen, +- 100 pixels in height from the player, and checks to see if it should attack or not
//--------------------------------------------
function createEnemy(_playerX, _playerY) {
    console.log('createEnemy()')
    let ySpawn = random(_playerY - 100, _playerY + 100)
    while (ySpawn >= groundHeight) {
        ySpawn -= 10;
    }
    enemyAttack += 1;
    enemy = new Sprite(_playerX - screenWidth / 2, ySpawn, 80, 30, 'd')

    //makes sure the enemy planes aren't in the ground


    //adds image to enemy
    enemy.image = (imgEnemy);
    enemy.image.scale.y = 0.3;
    enemy.image.scale.x = -0.3;

    //decides if enemy should attack player - set so every second plane attacks
    if (enemyAttack == 2) {
        attackPlayer(enemy.x, enemy.y)
    }

    enemyGroup.add(enemy)
}

//--------------------------------------------
//launchMissile(_Xpos, _Ypos)
//Creates a new missile sprite at the X & Y positions passed
//Called:   When the player presses the space bar - can only be called every 5 seconds 
//Input:    _Xpos - numerical value - Is the x position where the missile is created
//          _Ypos - numerical value - Is the y position where the missile is created
//Return:   Creates the missile sprite at _Xpos, _Ypos with the same Y vel and a 25% faster Xvel than the player plane
//--------------------------------------------
function launchMissile(_Xpos, _Ypos) {
    console.log('launchMissile()')
    missile = new Sprite(_Xpos - 20, _Ypos - 10, 150, 20, 'k');
    missile.vel.x = calculateHorizontalVelocityVectors(throttle, pitch, LIFTCOEFFICENT) * 1.25
    missile.vel.y = calculateVerticalVelocityVectors(throttle, pitch, LIFTCOEFFICENT)
    missile.image = (imgMissile)
    missile.scale.x = -0.3;
    missile.scale.y = 0.3;
    missile.life = 300;

}

//--------------------------------------------
//calculateHorizontalVelocityVectors(_speed, _angle, _liftOfObject)
//Calculates the horizontal velocity of a sprite based of the input speed, angle and lift coefficent
//Called:   In the draw loop (Every frame)
//Input:    _speed - Numerical value  greater than 0 - The current net speed of the sprite
//          _angle - Numerical value between -180 & 180 - the current angle of flight (Angle between direction of movement and horizontal) of the sprite 
//          _liftOfObject - numerical value - usualy between -1 & 1 - the greater the magnitude, the more prononced the movement
//Return:   horizontalSpeed - numerical value - the result of the calculations 
//--------------------------------------------
function calculateHorizontalVelocityVectors(_speed, _angle, _liftOfObject) {
    //convert to radians
    _angle = _angle * (Math.PI / 180)
    //calculation
    let horizontalSpeed = 0;
    horizontalSpeed = (Math.abs(_speed * (Math.cos(_angle) - Math.cos(90 - _angle) * _liftOfObject)));
    return horizontalSpeed;
}

//--------------------------------------------
//calculateVerticalVelocityVectors(_speed, _angle, _liftOfObject)
//Calculates the vertical velocity of a sprite based of the input speed, angle and lift coefficent
//Affected by FRAMERATE & GRAVITY constants
//Called:   In the draw loop (Every frame)
//Input:    _speed - Numerical value  greater than 0 - The current net speed of the sprite
//          _angle - Numerical value between -180 & 180 - the current angle of flight (Angle between direction of movement and horizontal) of the sprite 
//          _liftOfObject - numerical value - usualy between -1 & 1 - the greater the magnitude, the more prononced the movement
//Return:   verticalSpeed - numerical value >= -35 - the result of the calculations 
//--------------------------------------------
function calculateVerticalVelocityVectors(_speed, _angle, _liftOfObject) {
    //convert to radians
    _angle = _angle * (Math.PI / 180)
    //calculations 
    let verticalSpeed = 0;
    verticalSpeed = ((-1 * (_speed * (Math.sin(_angle) + Math.sin(90 + _angle) * _liftOfObject))) * 1 / (FRAMERATE)) + GRAVITY;

    //hardcaps max vertical speed to stop play skyrocketing
    if (verticalSpeed < -35) {
        verticalSpeed = -35;
    }

    return verticalSpeed;
}

//--------------------------------------------
//moveCameraAndWallAndGround(_percentPerFrame)
//moves all constant elements of the game (Camera, walls/roof, and the ground) to follow the plane
//Called:   In the draw loop (Every frame)
//Input:    _percentPerFrame - numerical value - between 0 & 100 - how much of the distance to the plane the elements move each frame - higher percentages result in jerky movement, lower result in the plane going off screen
//Return:   moves camera x,y towards the plane x,y
//          moves ground x towards the plane x
//          moves wallTop (roof) x towards the plane x
//--------------------------------------------
function moveCameraAndWallAndGround(_percentPerFrame) {
    camera.x += ((plane.x - camera.x) * (_percentPerFrame / 100)) + (1 / 14 * screenWidth);
    camera.y += (plane.y - camera.y) * (_percentPerFrame / 100);
    ground.x = camera.x;
    wallTop.x = camera.x;
}

//--------------------------------------------
//takeKeyboardInput()
//Recieves keyboard input and adjusts variables accordingly
//Called:   In the draw loop (Every frame)
//Input:    N/A
//Return:   Throttle - numerical value - between 0 & 120 - increased if w pressed, decreased if s pressed
//          Pitch - numerical value - between -65 & 65 - increased if a pressed, decreased is d pressed
//          MissileTimer - numerical value between 0 & 300- if space pressed set to 300, else no change
//--------------------------------------------
function takeKeyboardInput() {
    if (kb.pressing('w')) {
        if (throttle <= 120) {
            throttle = throttle * (1 + 0.1 / 6);
        }
    }

    if (kb.pressing('s')) {
        if (throttle >= 0.1) {
            throttle = throttle * (1 - 0.1 / 6);
        }
    }

    if (plane.colliding(ground) == false) {
        if (kb.pressing('a')) {
            if (pitch <= -65) {
                pitch = pitch;
            } else {
                pitch = pitch - (1 / 6 * Math.sqrt(throttle) * PITCHSENSITIVITY);
            }
        }

        if (kb.pressing('d')) {
            if (pitch >= 85) {
                pitch = pitch;
            } else {
                pitch = pitch + (1 / 6 * Math.sqrt(throttle) * PITCHSENSITIVITY)
            }
        }
    } else {
        pitch = 0;
    }

    if (kb.presses('shift') && missileTimer <= 0) {
        missileTimer = 300;
        launchMissile(plane.x, plane.y)
        console.log(mouseX, mouseY)
    }



    if (kb.presses('space') && chaffRemaining > 9) {
        chaffRemaining -= 10;
        for (i = 0; i < 10; i++) {
            chaff = new Sprite(plane.x - 100, plane.y + random(-50, 50), 10, 'd');
            chaff.vel.x = calculateHorizontalVelocityVectors(throttle, 0, 1) * 0.5;
            chaff.color = "#ff7600"
            chaff.life = 240;
            chaffGroup.add(chaff)
        }
    }

    return pitch, missileTimer, throttle;
}

//--------------------------------------------
//killEnemy(_enemyHit, _missile)
//Interaction between missile and enemy - kills both when they collide
//Called:   when the player launched missile collides with an element of the enemyGroup
//Input:    _enemyHit - the spefic sprite within the enemyGroup that was hit
//          _missile - the missile that collides with the enemy
//Return:   removes both _enemyHit & _missile
//          creates 100 explosion particles with a lifetime of 150 frames
//--------------------------------------------
function killEnemy(_enemyHit, _missile) {
    console.log("killEnemy()")
    let collisionSpeed = calculateHorizontalVelocityVectors(throttle, 0, 1);
    let collisionX = _enemyHit.x;
    let collisionY = _enemyHit.y;
    _missile.remove()
    _enemyHit.remove()
    score += 10;
    for (i = 0; i < 100; i++) {
        particle = new Sprite(collisionX, collisionY, 5, 'd')
        particle.color = '#FF7700';
        particle.strokeWeight = 0;
        particle.vel.x = collisionSpeed + random(-30, 30);
        particle.vel.y = random(-50, 50);
        particle.life = 150;
        particleGroup.add(particle)
    }
}

//--------------------------------------------
//attackPlayer(_launchX, _launchY)
//Creates a new missile to attack the player
//Called:   In the createEnemy() function 
//Input:    _launchX - The X position of where the missile spawns  
//          _launchY - The Y position of where the missile spawns
//Return:   enemyMissile - Sprite, created at _launchX, _launchY, exists for 300 frames
//--------------------------------------------
function attackPlayer(_launchX, _launchY) {
    console.log('attackPlayer()');
    enemyAttack = 0;
    enemyMissileExists = true;
    enemyMissile = new Sprite(_launchX, _launchY, 150, 20, 'd');
    enemyMissile.vel.x = plane.vel.x * 1.1//calculateHorizontalVelocityVectors(throttle, 0, 1)
    enemyMissile.image = (imgMissile)
    enemyMissile.scale.x = -0.3;
    enemyMissile.scale.y = 0.3;
    enemyMissile.life = 300;
}

//--------------------------------------------
//drawGame()
//main function for running the game - checks for collisions, updates positions,  
//Called:   in draw() - active after the player starts the game, until they die 
//Input:    N/A
//Return:   N/A
//--------------------------------------------
function drawGame() {
    plane.visible = true;
    enemyTimer -= 1;
    background('#0000ff');
    takeKeyboardInput()

    //missile collisions
    if (missileTimer >= 1) {
        enemyGroup.collides(missile, killEnemy)
        missileTimer -= 1;
    }

    //enemies attacking player
    if (enemyMissileExists) {
        if (enemyMissile.removed) {
            enemyMissileExists = false;
        } else {
            enemyMissile.x += (plane.x - enemyMissile.x) * 0.05;
            enemyMissile.y += (plane.y - enemyMissile.y) * 0.05;
            if (enemyMissile.collides(plane)) {
                gameState = "end"
            }
        }
    }

    //chaff collisions
    if (enemyMissileExists && chaffGroup.collides(enemyMissile)) {
        score += 5;
        enemyMissile.remove()
        enemyMissileExists = false;
    }

    //spawn enemy
    if (enemyTimer <= 0) {
        createEnemy(plane.x, plane.y)
        enemyTimer = 500;
    }

    //missile movement & removal after time
    if (missileTimer != 0) {
        if (missileTimer >= 250) {
            missile.x += (mouse.x - missile.x) * 0.075;
            missile.y += (mouse.y - missile.y) * 0.075;
        } else if (missileTimer >= 0) {
            missile.x = mouse.x;
            missile.y = mouse.y;
        }
    }
    //move clouds accros screen
    if (cloud.x < camera.x - screenWidth / 2) {
        cloud.x = camera.x + screenWidth / 2;
    }

    //cloud velocity 
    cloud.vel.x = plane.vel.x / 31.5;

    //move enemies so they are moving slightly faster than the plane
    enemyGroup.vel.x = plane.vel.x + 10;

    //Apply rotation and movement to the plane
    plane.rotation = pitch;
    plane.vel.x = calculateHorizontalVelocityVectors(throttle, pitch, LIFTCOEFFICENT);
    plane.vel.y = calculateVerticalVelocityVectors(throttle, pitch, LIFTCOEFFICENT);

    moveCameraAndWallAndGround(20)

    //updates score & chaff counters
    text("Score: " + score, 50, 100);
    text("Chaff Remaining: " + chaffRemaining, 50, 150)
}

//--------------------------------------------
//drawMenu()
//draws the menu screen with instructions and sources
//Called:   in draw() - active when the player loads the game, and after they exit the end game screen
//Input:    N/A
//Return:   N/A
//--------------------------------------------
function drawMenu() {
    background('#ffffff')
    plane.visible = false;
    ground.visible = false;
    cloud.visible = false;

    //start game
    if (kb.presses('enter')) {
        reset();
        gameState = "game";
    }
    text("Welcome to the plane flying thingymajig game \n The controls are: \n W to accelerate \nS to decelerate \nA to pitch(rotate) the plane up,\nD to pitch(rotate) the plane down \nShift to launch a missile - missiles follow mouse\n Press ENTER to start", 250, 400)
    text("Sources (Note - I have put all images through https://www.remove.bg/ to remove white backgrounds): \n Missile Image: https://www.deviantart.com/bagera3005/art/AIM-9X-Sidewinder-883880863  - cropped for use in game\nPlayer Plane (A-7): https://upload.wikimedia.org/wikipedia/commons/9/93/A-7_Corsair_II.svg \nEnemy Plane (F-14): https://upload.wikimedia.org/wikipedia/commons/5/5a/F14_2_Wiki.jpg \n Cloud: https://upload.wikimedia.org/wikipedia/commons/7/7e/Cloud_PNG_Image.png", 500, 600);
}

//--------------------------------------------
//drawEnd()
//draws the screen for when the player dies - displays score, makes sprites invisible
//Called:   in draw() - active after the player dies 
//Input:    N/A
//Return:   N/A
//--------------------------------------------
function drawEnd() {
    background('#ffffff')
    enemyGroup.deleteAll()
    chaffGroup.deleteAll()
    allSprites.visible = false;
    enemyMissile.visible = false;
    plane.visible = false;
    ground.visible = false;
    cloud.visible = false;
    text("You died - your score was: " + score + '\n Press enter to return to main menu', windowWidth / 2, windowHeight / 2);

    //-----------------------------------------
    //firebase write 
    //----------------------------------------
    fb_writeHighscore('planeGame', score)

    //return to main menu
    if (kb.presses('enter')) {
        gameState = "menu";
        reset();
    }
}

//--------------------------------------------
//reset()
//resets all variables to inital values, makes plane, ground and cloud visible 
//Called:   when enter pressed to start or restart the game - in the drawMenu() or drawEnd() functions 
//Input:    N/A
//Return:   N/A
//--------------------------------------------
function reset() {
    throttle = 0.5;
    pitch = 0;
    missileTimer = 0;
    score = 0;
    enemyTimer = 500;
    enemyMissileExists = false;
    gameRunning = true;
    chaffRemaining = 150;
    enemyAttack = 0;

    plane.x = screenWidth / 6;
    plane.y = groundHeight;
    moveCameraAndWallAndGround(100)

    enemyGroup.deleteAll()
    chaffGroup.deleteAll()
    allSprites.visible = true;

    plane.visible = true;
    ground.visible = true;
    cloud.visible = true;
}

//--------------------------------------------
//draw()
//runs every frame - checks to see which state the game is in, and decides which screen to display
//Called:   Every frame
//Input:    N/A
//Return:   N/A
//--------------------------------------------
function draw() {
    if (gameState == "menu") {
        drawMenu()
    } else if (gameState == "game") {
        drawGame()
    } else if (gameState == "end") {
        drawEnd()
    }
}