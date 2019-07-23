var ship = []; //Array of player ships
var projectile = []; //Array of projectiles
var asteroid = []; //Array of asteroids

const VERSION = "5.3.1"; //Server Version
const PORT = 8080; //Server Port
const TICKRATE = 125; //frequency with witch games simulation is calculated and send to client

const SHIP_LIVES = 6; //max number of lives of player ship
const ASTEROIDS_SIZE = 10; //max starting number of asteroids
const ASTEROIDS_POINTS = 6; //amount of points for drawing asteroid
const ASTEROIDS_NOISE = 20; //offset of points
const DEBUG = true; //toogle debug mode
const INFO = true; //toogle info mode
const WIDTH = 944; //canvas width
const HEIGHT = 600; //canvas height
const SHIP_HEIGHT = 10; //height of player ship
const PROJECTILE_SIZE = 5; //diameter of a projectile;
const SPAWN_PROTECTION = 2*TICKRATE; 
var Log = new Log(); 

//--------------------------------------

/**
 * Create new ship object
 * @param  {string}	id 		Socket ID of player
 * @param  {number} x     	x-coordinate of ship
 * @param  {number} y     	y-coordinate of ship
 * @param  {number} angle 	Angle of ship
 * @param  {number} score 	Score of player
 * @param  {array}  color   Color of ship as Array = {r,g,b}
 */
function Ship(id,x,y,angle,score,color,thrustActive){
	this.id = id;
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.score = score;
	this.color = color;
	this.thrustActive = thrustActive;
	this.lives = SHIP_LIVES;
	this.spawn_protection = SPAWN_PROTECTION + 3*TICKRATE;

	/**
 	* Check if ship is outside screen
 	* @return {boolean}		true: ship is outside screen
 	*/
	 this.border = function(){
		if ((this.x < -SHIP_HEIGHT) || (this.y < -SHIP_HEIGHT) || (this.x > WIDTH+SHIP_HEIGHT) || (this.y > HEIGHT+SHIP_HEIGHT)){
			return true;
		}
		return false;
	}
}


/**
 * Create new projectile object
 * @param  {string} id		Socket ID of Player
 * @param  {number} x  		x-coordinate of projectile
 * @param  {number} y   	y-coordinate of projectile
 * @param  {number} velx	Velocity of projectile in x direction
 * @param  {number} vely	Velocity of projectile in y direction
 */
function Projectile(id,x,y,velX,velY){
	this.id = id;
	this.x = x;
	this.y = y;
	this.velX = velX / TICKRATE;
	this.velY = velY / TICKRATE;
	this.size = PROJECTILE_SIZE;
	
	/**
 	* Update position of projectile
 	*/
	this.update = function(){
		this.x = this.x + this.velX;
		this.y = this.y + this.velY;
	}
	
	/**
 	* Check if projectile is outside screen
 	* @return {boolean}		true: if outside screen
 	*/
	this.border = function(){
		if ((this.x < -this.size) || (this.y < -this.size) || (this.x > WIDTH+this.size) || (this.y > HEIGHT+this.size)){
			return true;
		}
		return false;
	}
}

/**
 * Create new asteroid object
 */
function Asteroid(data){
	this.x = data.x;
	this.y = data.y;
	this.velX = data.velX / TICKRATE;
	this.velY = data.velY / TICKRATE;
	this.level = data.level;
	this.size = data.size; //diameter of asterooid
	this.points = [];

	for(let a = 0; a < 2*Math.PI; a += 2*Math.PI/(ASTEROIDS_POINTS+1)){
		if(this.level == 1){
			this.points.push({x: (this.size/2 - randomN(-5,8) )* Math.cos(a) + this.x ,y: (this.size/2 - randomN(-5,8) ) * Math.sin(a) + this.y});
		}else{
			this.points.push({x: (this.size/2 - random(-ASTEROIDS_NOISE+10,ASTEROIDS_NOISE) )* Math.cos(a) + this.x ,y: (this.size/2 - random(-ASTEROIDS_NOISE+10,ASTEROIDS_NOISE) ) * Math.sin(a) + this.y});
		}
	}

	/**
 	* Update position of asteroid
 	*/
	this.update = function(){
		this.x = this.x + this.velX;
		this.y = this.y + this.velY;
		for(let i = 0; i < this.points.length; i++){
			this.points[i].x += this.velX;
			this.points[i].y += this.velY;
		}
	}
	
	/**
 	* Check if asteroid is outside screen
 	* @return {boolean}		true: if outside screen
 	*/
	this.border = function(){
		if ((this.x < -this.size) || (this.y < -this.size) || (this.x > WIDTH+this.size) || (this.y > HEIGHT+this.size)){
			return true;
		}
		return false;
	}
}

function SpawnAsteroid(x,y,level,velX,velY){
	//set level of asteroid
	if(level == null){
		let rnd = random(1,100);
		if(rnd < 10){
			this.level = 1;
		}else if(rnd < 40){
			this.level = 2;
		}else{
			this.level = 3;
		}
	}else{
		this.level = level;
	}

	//set size of asteroid
	if(this.level == 3){
		this.size = random(80,140);
	}else if(this.level == 2){
		this.size = random(40,65);
	}else{
		this.size = random(18,30);
	}
	//Log.d(this.level + " : " + this.size);

	//set spawn location
	if(x == null && y == null){
		let spawn = random(1,4);
		switch(spawn) {
			case 1:	//left
				this.x = -this.size;
			  	this.y = random(this.size,HEIGHT-this.size);
			  	this.velX = randomN(0.1,0.5);
			  	this.velY = randomN(-0.2,0.2);
			  break;
			case 2: //up
				this.x = random(this.size,WIDTH-this.size);
				this.y = -this.size;
				this.velX = randomN(-0.2,0.2);
				this.velY = randomN(0.1,0.5);
			  break;
			case 3: //right
				this.x = WIDTH+this.size;	
				this.y = random(this.size,HEIGHT-this.size);
				this.velX = randomN(-0.5,-0.1);
				this.velY = randomN(-0.2,0.2);
			  break;
			case 4: //bottom
				this.x = random(this.size,WIDTH-this.size);
				this.y = HEIGHT+this.size;
				this.velX = randomN(-0.2,0.2);
				this.velY = randomN(-0.5,-0.1);
			  break;
			default:
		 	 Log.e("not allowed!");
	  }
	}else{
		this.x = x;
		this.y = y;
		//let rnd = random(1,2);
		this.velX = velX;
		this.velY = velY;
	}
	
	  let data = {
		x: this.x,
		y: this.y,
		velX: this.velX * 50,
		velY: this.velY * 50,
		level: this.level,
		size: this.size
	  }
	return data;
}

//--------------------------------------

var express = require('express');
var app = express();
var server = app.listen(PORT, function(){
  Log.i('------------------------------------------------------');
  Log.i('...starting server (v.' + VERSION + ')');
  Log.i('listening on *:' + PORT);
  Log.i('server running at ' + TICKRATE + ' ticks');
  Log.i('------------------------------------------------------');
});

//--------------------------------------

var socket = require('socket.io');
var io = socket(server);

//--------------------------------------

io.sockets.on('connection', newConnection);
function newConnection(socket){
	Log.s(">> " + socket.id);
	//Create random colorCode
	var color = {
		r: random(20,255),
		g: random(20,255),
		b: random(20,255)
	}
	
	//Add ship to array
	ship.push(new Ship(socket.id,WIDTH/2,HEIGHT/2,0,0,color));
	//Send colorCode to client
	socket.emit('start', color);
	
	socket.on('updatePos', function(data){
		var _ship = getShipByID(socket.id);
		if(_ship != null){
			_ship.x = data.x;
			_ship.y = data.y;
			_ship.angle = data.angle;
			_ship.thrustActive = data.thrustActive;
		}
	});
	
	socket.on('updateProjektil', function(data){
		//Add new projectile to array
		projectile.push(new Projectile(socket.id, parseInt(data.x), parseInt(data.y), parseInt(data.velX), parseInt(data.velY)));
	});
	
	socket.once('disconnect', function () {
		Log.s("<< " + socket.id);
		for(let i = 0; i < ship.length; i++){
			if(socket.id == ship[i].id){
				ship.splice(i, 1);
			}
		}
	});
}

/**
 * Find ship object by Socket ID
 * @param 	{string} id		Socket ID
 * @returns {ship} 	    	ship object or null
 */
function getShipByID(id){
	for(var i = 0; i < ship.length; i++){
		if(id == ship[i].id){
			return ship[i];
		}
	} return null;
}

/**
 * Get distance between two points
 * @param 	{number} x1		x-coordinate of first point
 * @param 	{number} y1 	y-coordinate of first point
 * @param 	{number} x2 	x-coordinate of second point
 * @param 	{number} y2		y-coordinate of second point
 * @returns {number} 		distance
 */
function getDistance(x1,y1,x2,y2){
	let a = Math.abs(x2-x1); 
	let b = Math.abs(y2-y1);
	return Math.sqrt(a*a + b*b);
}

/**
 * Returns a random number between min (inclusive) and max (inclusive)
 * @param 	{number} min 	lower limit
 * @param 	{number} max 	maximum limit	
 * @returns {number}		random number
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomN(min, max) {
	return Math.random() * (max - min + 1) + min;
}

setInterval( function update(){
	shipCheckHit();
	updateProjektil();
	updateAsteroid();
	if(asteroid.length < ASTEROIDS_SIZE){
		for(var j = 0; j < ASTEROIDS_SIZE-asteroid.length; j++){
			asteroid.push(new Asteroid(SpawnAsteroid()));
		}
	}
	io.sockets.emit('heartbeat', {ship: ship, projectile: projectile, asteroids: asteroid});
}, 1000/TICKRATE);

/**
 * Update projectiles
 */
function updateProjektil(){
	for(var i = 0; i < projectile.length; i++){
		if(!projectile[i].border()){
			projectile[i].update();
		}else{
			//Remove projectile from array
			projectile.splice(i,1); 
		}
	}
}

/**
 * Update asteroids	
 */
function updateAsteroid(){
	for(let i = 0; i < asteroid.length; i++){
		if(!asteroid[i].border()){
			let hit = false;
			let _projectile;
			for(let j = 0; j < projectile.length; j++){
				if(getDistance(asteroid[i].x,asteroid[i].y,projectile[j].x,projectile[j].y) <= asteroid[i].size/2){
					let _ship = getShipByID(projectile[j].id);
					if(_ship != null)
						//add points to score based ooon asteroid level (->size)
						if(asteroid[i].level == 3){
							_ship.score += 20;
						}else if(asteroid[i].level == 2){
							_ship.score += 50;
						}else{
							_ship.score += 100;
						}
					_projectile = projectile[j];
					projectile.splice(j,1);
					hit = true;
				}
			}
			if(hit){
				if(asteroid[i].level > 1){
					asteroid.push(new Asteroid(SpawnAsteroid(asteroid[i].x,asteroid[i].y,asteroid[i].level-1,randomN(-0.5,0.5),randomN(-0.5,0.5))));
					asteroid.push(new Asteroid(SpawnAsteroid(asteroid[i].x,asteroid[i].y,asteroid[i].level-1,randomN(-0.5,0.5),randomN(-0.5,0.5))));
				}
				io.sockets.emit('explosion', {x: asteroid[i].x, y: asteroid[i].y, velX: _projectile.velX, velY: _projectile.velY});
				asteroid.splice(i,1);
			}else{
				asteroid[i].update();
			}
		}else{
			//Remove asteroide from array
			asteroid.splice(i,1); 
		}
	}
}

/**
 * Check if ship has been hit by projectile or ship outside screen
 */
function shipCheckHit(){
	for(let i = 0; i < ship.length; i++){
		if(ship[i].spawn_protection == 0){
			for(let j = 0; j < projectile.length; j++){
				if(ship[i] != null && projectile[j].id != ship[i].id) //Ignore friendly fire
				if(projectile[j].x >= ship[i].x - 10 && projectile[j].x <= ship[i].x + 10 && projectile[j].y >= ship[i].y -5  && projectile[j].y <= ship[i].y + 15){

					let _ship = getShipByID(projectile[j].id);
					if(_ship != null)
						_ship.score += 100;

					if(ship[i].lives == 1){
						//Send kill code
						io.to(ship[i].id).emit('death', "");
						//Remove ship from array
						ship.splice(i, 1);
					}else{
						ship[i].lives--;
						ship[i].spawn_protection = SPAWN_PROTECTION;
					}
					//Remove projectile from array
					projectile.splice(j,1);
				}
			}
			for(let j = 0; j < asteroid.length; j++){
				if(ship[i] != null && getDistance(ship[i].x,ship[i].y,asteroid[j].x,asteroid[j].y) <= asteroid[j].size/2){
					if(ship[i].lives == 1){
						//Send kill code
						io.to(ship[i].id).emit('death', "");
						//Remove ship from array
						ship.splice(i, 1);
					}else{
						ship[i].lives--;
						ship[i].spawn_protection = SPAWN_PROTECTION;
					}
					if(asteroid[j].level > 1){
						asteroid.push(new Asteroid(SpawnAsteroid(asteroid[j].x,asteroid[j].y,asteroid[j].level-1,randomN(-0.5,0.5),randomN(-0.5,0.5))));
						asteroid.push(new Asteroid(SpawnAsteroid(asteroid[j].x,asteroid[j].y,asteroid[j].level-1,randomN(-0.5,0.5),randomN(-0.5,0.5))));
					}
					io.sockets.emit('explosion', {x: asteroid[j].x, y: asteroid[j].y});
					asteroid.splice(j,1);
				}
			}
		}else{
			//Log.w('spawn protection')
			ship[i].spawn_protection--;
		}
		//Check if ship is outside screen
		if(ship[i] != null && ship[i].border()){
			//Send kill code
			io.to(ship[i].id).emit('death', "");
			//Remove ship from array
			ship.splice(i, 1);
		}
	}
}

function Log(msg){

	this.s = function(msg){
		if(msg != "" && msg != null)
			console.log('\t'+msg);
	}

	this.e = function(msg){
		if(msg != "" && msg != null)
			console.log('\x1b[91m%s\x1b[0m', '[ERROR] '+msg);
	}

	this.w = function(msg){
		if(msg != "" && msg != null)
			console.log('\x1b[93m%s\x1b[0m', '[WARN] '+msg);
	}

	this.i = function(msg){
		if(INFO && (msg != "" && msg != null))
			console.log('\x1b[32m%s\x1b[0m', '[INFO] \t'+msg);
	}

	this.d = function(msg){
		if(DEBUG && (msg != "" && msg != null))
			console.log('\x1b[36m%s\x1b[0m', '[DEBUG]\t'+msg);
	}

}