//sound
var ship_explosion, asteroid_explosion, alarm, shooting;
var SOUND = true;
//font
var font;
var fontsize = 44;
var i = 0; //counter

var ship; //own ship
var shipOldAngle = 0; 
var score = 0; //own score
var lives; //own lives

var ships = []; //array of ships
var ships_count = 0;
var star = []; //array of stars (background)
var projectile = []; //array of projectiles
var asteroid = []; //array of asteroids
var particle = []; //array of particles for effect
const PARTICLE = 20; //amount of particles
const DURATION = 120; //duration of particles
const VELOCITY = 0.25; //velocity of particles

var socket;

var LIVES; //Max ship lives

//Server 
const IP = "";
const PORT = 8080;

//canvis
const WIDTH = 944; //canvas width
const HEIGHT = 600; //canvas height

var colorMode;

//--------------------------------------

/**
 * Preload all files
 */
function preload(){
    //preload sound files
    ship_explosion = loadSound('asteroids_game/assets/sound/explosion1.wav');
    asteroid_explosion = loadSound('asteroids_game/assets/sound/explosion3.wav');
    alarm = loadSound('asteroids_game/assets/sound/alarm9.wav');
    shooting = loadSound('asteroids_game/assets/sound/shooting.wav');
    //preload font file
    font = loadFont('asteroids_game/assets/font/Rajdhani-Regular.ttf');
}


function setup() {
  colorMode = false;
  //connect to server
  socket = io.connect(IP+':'+PORT);
  
  socket.on('start', function(color) {
    //create own ship
    ship = new Ship(socket.id,color.r,color.g,color.b);
  });
  
  socket.on('death', function(data) {
    //own ship destroyed
    if(SOUND)
      ship_explosion.play();
    ship.destroyed = true;
  });

  socket.on('explosion', function(data) {
    if(SOUND)
      asteroid_explosion.play();
    for(let p = 0; p < PARTICLE; p++){
        particle.push(new Particle(data.x,data.y,data.velX,data.velY));
    }
  });

  socket.on('heartbeat', function(data) {
   //Update Ships
   //check if the amount of ships changed
   if(ships_count != ships.length){
     ships = [];
   }
   ships_count = 0;
  
    document.getElementById("js_leaderboard").innerHTML = ""; //clear leaderboard below canvas
    for(var i = 0; i < data.ship.length; i++){
      
      if(socket.id != data.ship[i].id){ //don't process own ship
        ships_count++;
        var ship_ = getShipByID(data.ship[i].id);
        if(ship_ == null){ //add new ship to array
           ships.push(new Ship(data.ship[i].id,data.ship[i].color.r,data.ship[i].color.g,data.ship[i].color.b));
         }else{ //update pos of ship
           ship_.setPosition(data.ship[i].x,data.ship[i].y,data.ship[i].angle,data.ship[i].spawn_protection,data.ship[i].thrustActive);
         }
      }else{
         score = data.ship[i].score; //set own score 
         lives = data.ship[i].lives; //set own lives
         ship.spawn_protection = data.ship[i].spawn_protection;
         //set max lives once
         if(LIVES == null){
           LIVES = lives;
         }
      }
      //update leaderboard below canvas
      document.getElementById("js_leaderboard").innerHTML += "<span style='color: rgb("+ data.ship[i].color.r +","+ data.ship[i].color.g +","+ data.ship[i].color.b +")'>█</span> "+ data.ship[i].score + " ";
    } 

    //------------------------------------------------------------
    //Update asteroids
    asteroid = [];
    
    for(var i = 0; i < data.asteroids.length; i++){
      asteroid.push(new Asteroid(data.asteroids[i].x, data.asteroids[i].y, data.asteroids[i].size, data.asteroids[i].points)); 
    }

    //------------------------------------------------------------
    //Update projectiles
    //check if the amount of projectiles changed | true: amount has changed
     var update = false;
     if(data.projectile.length != projectile.length){
        projectile = []; 
        update = true;
     }
     
     for(var i = 0; i < data.projectile.length; i++){
        if(update){ //add new projectile to array
          if(data.projectile[i].id == socket.id)
            projectile.push(new Projectile(data.projectile[i].x, data.projectile[i].y, data.projectile[i].size, true)); 
          else
            projectile.push(new Projectile(data.projectile[i].x, data.projectile[i].y, data.projectile[i].size, false)); 
        }else{ //update pos of projectile
          projectile[i].setPosition(data.projectile[i].x,data.projectile[i].y);
        }
     }
  });
  
  //draw canvas in div box
  var canvas = createCanvas(WIDTH,HEIGHT);
  canvas.parent('js_box');
  
  //create star background
  for(var i = 0; i < 50; i++){
     star.push(new Star()); 
  }
  
  textFont(font);
  textSize(fontsize);
  textAlign(CENTER, CENTER);
}

/**
 * Find ship object by Socket ID
 * @param 	{string} id		Socket ID
 * @returns {ship} 	    	ship object or null
 */
function getShipByID(id){
   for(var j = 0; j < ships.length; j++){
    if(id == ships[j].id){
      return ships[j];
    }
  } return null; 
}

/**
 * Draw canvas content over and over
 */
function draw() {
  background(0); //Background color
  //Draw star background
  fill(255);
  //Draw star background
  for(var s = 0; s < star.length; s++){
    star[s].render(); 
  }

  //Check if socket is connected
  if(!socket.connected){
    //Draw 'connecting to server' animation
    var x = width/2
    var y = height/2
    fill(255);
    textSize(fontsize-15);
    if(i < 5){
      text("| connecting to server |",x-1,y);
    }else if( i < 10){
      text("\\ connecting to server /",x,y);
    }else if( i < 15){
      text("-- connecting to server --",x,y);
    }else{
      text("/ connecting to server \\",x,y);
    }

    i > 20 ? i = 0 : i++;

  }else{ //Socket is connected
      if(ship != null){ //Check if own ship is already crreated
        if(!ship.destroyed){
          //Draw own ship
          ship.run();
          updateUser();
        }
      }
    
    //Draw all other ships
    for(var j = 0; j < ships.length; j++){
      if(ships[j] != null){
        ships[j].run();
      }
    }
    
   //Draw projectiles
   for(var p = 0; p < projectile.length; p++){
      if(projectile[p] != null){
        projectile[p].run();
      }
    }

    //Draw asteroids
    for(var p = 0; p < asteroid.length; p++){
      if(asteroid[p] != null){
        asteroid[p].run();
      }
    }

    //Draw particle effect
    for(let p = 0; p < particle.length; p++){
      if(particle[p].duration > 0){
        particle[p].run();
        particle[p].duration -= 1;
      }else{
        particle.splice(p,1);
      }
    }
    
   
   if(ship != null){
     if(!ship.destroyed){
       //Draw own score
       textSize(fontsize-15);
       text("SCORE " + pad(score,5),width-100,20);
       fill(68,68,68);
       //Draw own ship max lives 
       for(var j = 0; j < LIVES; j++){
          rect(10 + j*5,5,3,15);
        }
       //Set color of lives depending on its number
       if(lives == 1){
         fill(255,0,0);
         //play alarm
         if(i == 0 && SOUND)
           alarm.play();
         i > 60 ? i = 0 : i++;

       }else if(lives == 2){
          fill(255,109,2); 
       }else if(lives == 3){
          fill(247,216,0); 
       }else if(lives == 4){
          fill(196,245,3); 
       }else{
          fill(152,247,0); 
       }
       //Draw own ship lives 
       for(var j = 0; j < lives; j++){
          rect(10 + j*5,5,3,15);
       }
     }else{
        //If own Ship destroyed, show game over
        textSize(fontsize);
        fill(255);
        text("GAME OVER",width/2,height/2);
        textSize(fontsize-15);
        if(score > 99999)
          text("SCORE: 99999",width/2,height/2 + 40);
        else
          text("SCORE: " + pad(score,5),width/2,height/2 + 40);
     }
   }
  }
}

//display score as 00000
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

/**
 * Send update to server if own ship moved
 */
function updateUser() {
  if(ship.vel.mag() != 0 || ship.heading != shipOldAngle){
    shipOldAngle = ship.heading;
     socket.emit('updatePos', { x: ship.pos.x, y: ship.pos.y, angle: ship.heading, thrustActive: ship.thrustActive}); 
  }
}

/**
 * Disconnect from socket
 */
function deleteUser() {
   socket.disconnect();
}

/**
 * Create new Star object
 */
function Star(){
  this.pos = createVector(random(0,width), random(0,height)); //random pos
  this.size = random(1,3); //random size
  
  this.render = function(){
    push();
    stroke(random(100,150));
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    pop();
  }
    
}

function keyReleased(){
  if(ship != null){
    if (keyCode === 65) { // key(a) -> turn left
      ship.setRotation(0);
    } else if (keyCode === 68) { // key(d) -> turn right
      ship.setRotation(0);
    } else if (keyCode === 87) { // key(w) -> go forward
      ship.thrust(false);
    }
  }
}

function keyPressed() {
  if(ship != null){
    if (keyCode === 65) { // key(a) -> turn left
      ship.setRotation(-0.05);
    } else if (keyCode === 68) { // key(d) ->turn right
      ship.setRotation(0.05);
    } else if (keyCode === 87) { // key(w) -> go forward
      ship.thrust(true);
    } else if (keyCode === 32 ) { // key(space bar) -> shooting
      if(!ship.destroyed){
        if(SOUND)
          shooting.play();
        //force of new projectile
        var force = p5.Vector.fromAngle(ship.heading - PI/2);
        force.mult(20); 
        //send new projectile to server
        socket.emit('updateProjektil', { x: ship.pos.x, y: ship.pos.y, velX: force.x*15, velY: force.y*15}); 
      }
    } else if (keyCode === 77){
      SOUND = !SOUND;
    }
  }
}

//prevent space bar from scrolling page
window.addEventListener('keydown', function(e) {
  if(e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});

//--------------------------------------

/**
 * Create new projectile object
 * @param  {number}  x     x-coordinate of projectile
 * @param  {number}  y     y-coordinate of projectile
 * @param  {number}  size  Size of bullet
 * @param  {boolean} color 
 */
function Projectile(x,y,size,color){
    this.x = x;
    this.y = y;
    this.bulletSize = size; //change bulletSize on server!
    this.color = color;
    
  this.run = function(){
     this.render();
  }
    
  this.render = function(){
    push();
    if(colorMode){
      if(this.color)
        fill(6,184,255);
      else
        fill(255,6,27);
    }else{
      fill(255);
    }
    ellipse(this.x, this.y, this.bulletSize);
    pop();
  }
  
  this.setPosition = function(x,y){
     this.x = x;
     this.y = y;
  }
}

/**
 * Create new asteroid object
 * @param  {number} x    x-coordinate of projectile
 * @param  {number} y    y-coordinate of projectile
 * @param  {number} size Size of asteroid
 */
function Asteroid(x,y,size,points){
    this.x = x;
    this.y = y;
    this.size = size;
    this.points = points;
  
  this.run = function(){
    this.render();
  }
  
  this.render = function(){
    push();
    fill(0);
    stroke(68,68,68);
    strokeWeight(2);
    //ellipse(this.x, this.y, this.size);
    beginShape();
    for(let p = 0; p < points.length; p++){
      vertex(points[p].x, points[p].y);
    }
    endShape(CLOSE);
    pop();
  }
}

function Particle(x,y,velX,velY){
    this.velX = velX;
    this.velY = velY;
    this.pos = createVector(x,y);
    if(velX != null && velY != null){
      this.force = createVector(this.velX + random(-PI/2,PI/2),this.velY + random(-PI/2,PI/2));
      this.force.mult(VELOCITY+0.5);
    }else{
      this.force = createVector(random(-PI,PI),random(-PI,PI));
      this.force.mult(VELOCITY);
    }
    this.duration = DURATION;
    this.brightness = 255;
    this.fadeAmount = 255/DURATION;

  this.run = function(){
    this.render();
    this.update();
  }
    
  this.render = function(){
    push();
    fill(0);
    stroke(170,170,170,this.brightness);
    strokeWeight(2);
    point(this.pos.x, this.pos.y);
    pop();
    this.brightness = this.brightness - this.fadeAmount;
  }

  this.update = function(){
    this.pos.add(this.force);
  }
}