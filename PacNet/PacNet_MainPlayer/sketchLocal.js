// server variables
var myUserID;
var dataServer;
var channelName = "pacnet";

//variables for the size and direction of pacman
var pacmanX = 50;
var pacmanY = 50;
var direction = 1;
var radius = 40;

var canvasX = innerWidth;
var canvasY = innerHeight;

//variable to hold the serial port object
var serial; 
//array that will hold all values coming from arduino
var ardVal = []; 


function setup() {
    
    createCanvas(canvasX, canvasY);
    background('#000000');
    ellipseMode(RADIUS);
    
    //Setting up the serial port
    serial = new p5.SerialPort(); //create the serial port object
    serial.open("COM4"); //open the serialport
    serial.on('open', ardCon); //open the socket connection and execute the ardCon callback
    serial.on('data', dataReceived); //when data is received execute the dataReceived function
    
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
   
    //Draw the Pacman
    if (direction == 1) {
        noStroke();
        fill(255);
        arc(pacmanX, pacmanY, radius, radius, 0.52, 5.76); // Face right 
    }
    else {
        noStroke();
        fill(255);
        arc(pacmanX, pacmanY, radius, radius, 3.67, 8.9); // Face left 
    }
    
    //Move the pacman based on joystick input
    if (ardVal[0] > 518) { //joystick to the left
        direction = 1;
        pacmanX += 10 * direction; //Move the pacman to the right
        
        //Make sure the pacman doesn't move beyond the canvas
        if ((pacmanX > canvasX - radius)) {
            direction = -direction;
            pacmanX = canvasX - radius;
        }
    }
    else if (ardVal[0] < 518) { //joystick to the left
        direction = -1;
        pacmanX += 10 * direction; //Move the pacman to the left
        
        if (pacmanX < radius) {
            direction = -direction;
            pacmanX = radius;
        }
    }
    
    if (ardVal[1] < 511) { //joystick up
        pacmanY -= 10; //Move the pacman upwards
        if (pacmanY < radius) {
            pacmanY = radius;
        }
    }
    else if (ardVal[1] > 511) { //joystick down
        pacmanY += 10; //Move the pacman downwards
        if (pacmanY > canvasY - radius) {
            pacmanY = canvasY - radius;
        }
    }
    
    sendDatatoServer(); //Publish the data to Pubnub
    
}

function sendDatatoServer() {
    // Send Data to the server to draw the pacman in all other canvases
    dataServer.publish({
        channel: channelName
        , message: {
            userID: myUserID,  
            avatarX: pacmanX
            , avatarY: pacmanY
            , dir: direction
        }
    });
}

function dataReceived() //this function is called every time data is received
{
    var rawData = serial.readStringUntil('\r\n'); //read the incoming string until it sees a newline
    if (rawData.length > 1) //check that there is something in the string
    { //values received in pairs  index,value
        console.log(rawData)
        var incoming = rawData.split(","); //split the string into components using the comma as a delimiter
        for (var i = 0; i < incoming.length; i++) {
            ardVal[i] = parseInt(incoming[i]); //convert the values to ints and put them into the ardVal array
        }
    }
}

//Listens to the received data and draws the circles
function readIncoming(message) {
    if (message.userID != myUserID) {
        background('#000000');
        noStroke();
        fill(message.r, message.g, message.b);
        ellipse(message.circleX, message.circleY, 20, 20);
        //If the pacman cought the circles, reload the page
        if (message.circleX > pacmanX - 40 && message.circleX < pacmanX + 40 && message.circleY > pacmanY - 40 && message.circleY < pacmanY + 40) {
            location.reload();
        }
    }
}

function ardCon() {
    console.log("connected to the arduino");
}