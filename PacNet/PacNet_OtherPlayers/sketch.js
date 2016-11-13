// server variables
var myUserID;
var dataServer;

//variables for the size and color of the circles
var brushR;
var brushG;
var brushB;
var channelName = "pacnet";
var ballPositionX;
var ballPositionY;

var canvasX = innerWidth;
var canvasY = innerHeight;

var serial; //variable to hold the serial port object
var ardVal = []; //array that will hold all values coming from arduino


function setup() {
    createCanvas(canvasX, canvasY);
    background('#000000');
    
    //pick a random color and position for the balls
    brushR = floor(random(150, 255));
    brushG = floor(random(150, 255));
    brushB = floor(random(150, 255));
    ballPositionX = floor(random(40, innerWidth - 40));
    ballPositionY = floor(random(40, innerHeight - 40));
    
    // initialize pubnub
    dataServer = PUBNUB.init({
        publish_key: 'pub-c-4596a555-385b-4236-9944-6ff789f5522b', 
        subscribe_key: 'sub-c-a6164080-a7cf-11e6-a7a5-0619f8945a4f'
        , uuid: myUserID
        , ssl: true 
    });
    dataServer.subscribe( //start listening to a specific channel
        {
            channel: channelName, 
            message: readIncoming 
        });
    myUserID = PUBNUB.uuid(); 
}

function draw() {
    
  //Draw the balls
    noStroke();
    fill(brushR, brushG, brushB);
    ellipse(ballPositionX, ballPositionY, 20, 20);
    
    //Move the balls according to keyboard inputs
    if (keyIsPressed) {
        
        switch (keyCode) {
        case LEFT_ARROW:
            ballPositionX -= 20;
            if (ballPositionX < 20) { //Make sure the ball doesn't go beyond the canvas
                ballPositionX = 20;
            }
            break;
        case RIGHT_ARROW:
            ballPositionX += 20;
            if (ballPositionX > canvasX - 20) {
                ballPositionX = canvasX - 20;
            }
            break;
        case UP_ARROW:
            ballPositionY -= 20;
            if (ballPositionY < 20) {
                ballPositionY = 20;
            }
            break;
        case DOWN_ARROW:
            ballPositionY += 20;
            if (ballPositionY > canvasY - 20) {
                ballPositionY = canvasY - 20;
            }
            break;
        }
    }
    
    sendDatatoServer();
}

function sendDatatoServer() {
    // Send Data to the server to draw the balls in other canvas
    dataServer.publish({
        channel: channelName
        , message: {
            userID: myUserID,    
            circleX: ballPositionX
            , circleY: ballPositionY
            , r: brushR
            , g: brushG
            , b: brushB
        }
    });
}

//Listens to the received data and draws the pacman
function readIncoming(message) {
    if (message.userID != myUserID) {
        
        background('#000000');
        noStroke();
        fill(255);
        message.avatarX += 0.5 * message.dir;
        if ((message.avatarX > canvasX - 40) || (message.avatarX < 40)) {
            message.dir = -message.dir; // Flip direction 
        }
        if (message.dir == 1) {
            arc(message.avatarX, message.avatarY, 40, 40, 0.52, 5.76); // Face right 
        }
        else {
            arc(message.avatarX, message.avatarY, 40, 40, 3.67, 8.9); // Face left 
        }
         //If the pacman cought the circles, reload the page
        if (ballPositionX > message.avatarX - 40 && ballPositionX < message.avatarX + 40 && ballPositionY > message.avatarY - 40 && ballPositionY < message.avatarY + 40) {
            location.reload();
        }
    }
}