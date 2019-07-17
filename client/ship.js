function Ship(id,r,g,b) {
  
     this.id = id;
  
     this.pos = createVector(width/2, height/2);
     this.vel = createVector(0,0);
     this.acc = createVector(0,0);
   
     //color of ship
     this.r = r;
     this.g = g;
     this.b = b;

     this.spawn_protection = 0;
     this.brightness = 255;
     this.fadeAmount = 10;
     
     this.maxSpeed = 5; //Max speed of ship
   
     this.size = 10; //size of ship
     this.heading = 0;
     this.rotation = 0;
     
     this.thrustActive = false;
     this.destroyed = false;
   
  this.run = function(){
      this.render();
      this.update();
  }
  
  //draw ship
  this.render = function(){
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.heading);
    fill(0);
    strokeWeight(2);

    if(this.thrustActive){
      stroke(208,86,0);
      beginShape();
      vertex(-this.size/2, this.size/2);
      vertex(0, this.size+this.size/2); 
      vertex(this.size/2, this.size/2); 
      endShape(CLOSE);
    }

    if(this.spawn_protection > 0){
      stroke(r,g,b,this.brightness);
      this.brightness -= this.fadeAmount;
      if(this.brightness <= 50 || this.brightness >= 255)
         this.fadeAmount = -this.fadeAmount;
    }else{
      stroke(r,g,b);
    }
    //triangle(-this.size, this.size, this.size, this.size,  0,  -this.size);
    beginShape();
    vertex(-this.size, this.size);
    vertex(-this.size+3, this.size/2);
    vertex(this.size-3, this.size/2); 
    vertex(this.size, this.size);
    vertex(0, -this.size); 
    endShape(CLOSE);
    pop();
  }
  
  this.setRotation = function(angle){
      this.rotation = angle;
  }
  
  this.applyForce = function(force){
     this.acc.add(force); 
  }
  
  this.thrust = function(thrustActive){
      this.thrustActive = thrustActive;
  }
  
  this.update = function(){
     this.vel.add(this.acc);
     this.vel.limit(this.maxSpeed);
     this.vel.mult(0.99);
     
     //Stop Ship if vel is very low
     if(this.acc.mag() == 0 && this.vel.mag() <= 0.09){
        this.vel.setMag(0); 
     }
     
     this.pos.add(this.vel);
     this.acc.set(0,0);
     
     this.heading += this.rotation;
     if(this.heading > (2*PI) || this.heading < (-2*PI)){
        this.heading = 0; 
     }
      
     if(this.thrustActive){
       var force = p5.Vector.fromAngle(this.heading - PI/2);
       force.mult(0.05);
       this.applyForce(force);
     }
  }
  
  this.setPosition = function(x,y,angle,spawn_protection,thrustActive){
     this.pos.x = x;
     this.pos.y = y;
     this.heading = angle;
     this.spawn_protection = spawn_protection;
     this.thrustActive = thrustActive;
  }

}
