
const LIVES = 5;
// STEUERUNG
const KEY_BOOST = 'KeyW'; // Taste zum Beschleunigen
const KEY_SPAWN = 'KeyS'; // Todo: entfernen
const KEY_SHOOT_ROCKET = 'KeyR'; // Taste zur Lenkraketenfreigabe
const KEY_SHOOT_LASER = 'Space'; // Taste zur Lenkraketenfreigabe
// KONSTANTEN
const MAX_OBJECTS = 12; // Maximale Anzahl von Objekten auf dem Bildschirm
const SHIP_ACCELERATION = 750; // Schiffbeschleunigung in Pixel pro Quadratsekunde
const MISSILE_VELOCITY = 350; // Lenkraketengeschwindigkeit in Pixel pro Sekunde
const MISSILE_DELAY = 1000; // Lenkraketenabklingzeit in Millisekunden
const MISSILE_TURN_ANGLE = 0.02; // Maximaler Lenkraktendrehwinkel in Radianten
const LASER_VELOCITY = 450; // LASER-Geschwindigkeit in Pixel pro Sekunde
const LASER_DELAY = 450; // Laserabklingzeit in Millisekunden
const UFO_VELOCITY = 150; // UFO-Geschwindigkeit in Pixel pro Sekunde
const UFO_PROP_SPAWN = 0.5; // Wahrscheinlichkeit für Erscheinen eines UFOs pro Sekunde
const UFO_PROP_LASER = 0.4; // Wahrscheinlichkeit für Erscheinen eines LASERs pro Sekunde
const UFO_PROP_ROCKET = 0.1; // Wahrscheinlichkeit für Erscheinen eines LASERs pro Sekunde
// Knopf
var versionID = document.getElementById("versionID");
var hardMobile = document.getElementById("hardMobile");
var theme = document.getElementById("theme");
const parent = document.getElementById('scene');
let highScore = 0
let livesMeter = document.getElementById('livesMeter')
var lives = LIVES;
var mobile = false;
let highMeter = document.getElementById('highScore')
var muteButton = document.getElementById("muteButton");
muteButton.addEventListener("click", muteUnMute); 
hardMobile.addEventListener("click", switchMobile);    
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
mobile = true;
}
var mute = true

hardMobile.checked = mobile;

const gitVersion = new XMLHttpRequest();
gitVersion.open("GET", 'https://api.github.com/repos/efim-sys/metaballs/commits/main');
gitVersion.send();
gitVersion.onreadystatechange = (e) => {
versionID.innerHTML = "v. "+gitVersion.responseText.substring(12, 19);
}

function switchMobile(){
mobile = hardMobile.checked;
}

function muteUnMute(){
if(mute){
    mute = false;
    muteButton.innerHTML = "🔊"; 
    theme.play();
}
else{
    mute = true;
    muteButton.innerHTML = "🔈";
    theme.pause();
}
}
    
// Object
class Obj {
constructor(id) {
    this.id = id;
    this.element = document.getElementById(id).cloneNode();

    this.element.onload = () => {
        this.content = this.element.contentDocument;
    }

    this.position = {x: 0, y: 0};
    this.velocity = {x: 0, y: 0};
    this.acceleration = {x: 0, y: 0};
    this.rotation = 0;
}
update(dt) {
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
}
setStyle() {
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
    this.element.style.transform = `translate(-50%,-50%) rotate(${this.rotation}rad)`;
    if(this.author.id === "ship" && this.id === "laser")this.element.data = "mylaser"
}
hitbox() {
    return this.element.getBoundingClientRect();
}
swapSpeed() {
    var temp;
    
    temp = this.velocity.x;
    this.velocity.x = this.velocity.y;
    this.velocity.y = temp;
    
    temp = this.acceleration.x;
    this.acceleration.x = this.acceleration.y;
    this.acceleration.y = temp;
}
wormhole() {
    if (this.position.x < 0 || this.position.x >= window.innerWidth) {
        //this.swapSpeed();
        //this.position.x = this.position.y / window.innerHeight * window.innerWidth;
        //this.position.y = this.velocity.y > 0 ? 0 : window.innerHeight - 1;
        this.position.x = (window.innerWidth - 1) * (this.position.x < 0);
    }

    if (this.position.y < 0 || this.position.y >= window.innerHeight) {
        //this.swapSpeed();
        //this.position.y = this.position.x / window.innerWidth * window.innerHeight;
        //this.position.x = this.velocity.x > 0 ? 0 : window.innerWidth - 1;
        this.position.y = (window.innerHeight - 1) * (this.position.y < 0);
    }
    // this.position.x = (this.position.x + window.innerWidth) % window.innerWidth;
    // this.position.y = (this.position.y + window.innerHeight) % window.innerHeight;
}
outofmap() {
    return (
        this.position.x < 0 ||
        this.position.x >= window.innerWidth ||
        this.position.y < 0 ||
        this.position.y >= window.innerHeight
    )
}
colliding(obj) {
    var a = this.hitbox();
    var b = obj.hitbox();
    return !(
        ((a.top + a.height) < (b.top)) ||
        (a.top > (b.top + b.height)) ||
        ((a.left + a.width) < b.left) ||
        (a.left > (b.left + b.width))
    );
}
isInside(x, y) {
    var rect = this.hitbox();
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}
}
// Szenenobjekt
class Scene {
constructor() {
    this.running = true;
    this.objects = new Set();
    this.count = 0;

    this.now = 0;
    this.last = 0;
    this.dt = 0;

    this.lastLaser = 0;
    this.lastMissile = 0;

    this.mouse = {x: 0, y: 0};
    this.keys = new Set();

    this.ship = new Obj('ship');
    this.ship.position.x = window.innerWidth / 2;
    this.ship.position.y = window.innerHeight / 2;
    this.add(this.ship);

    this.aim = document.getElementById('target');
    this.score = document.getElementById('score')
    this.target = undefined;
}
addPoints(points) {
    this.count += points;
if(this.count > highScore){highScore = this.count;highMeter.innerHTML = highScore}
    this.score.innerHTML = this.count;
}
add(obj) {
    this.objects.add(obj);
    parent.appendChild(obj.element);
}
remove(obj) {
    this.objects.delete(obj);
    parent.removeChild(obj.element);
}
shootLaser(author, direction) {
    var laser = new Obj('laser');
    laser.position.x = author.position.x;
    laser.position.y = author.position.y;
    laser.rotation = direction;
    laser.velocity.x = LASER_VELOCITY * Math.cos(direction);
    laser.velocity.y = LASER_VELOCITY * Math.sin(direction);
    laser.author = author;
    this.add(laser);
}
shootMissile(author, target) {
    var missile = new Obj('missile');
    missile.position.x = author.position.x;
    missile.position.y = author.position.y;
    missile.rotation = author.rotation;
    missile.author = author;
    missile.target = target;
    this.add(missile);
}
update() {
    this.target = undefined;
    for (var obj of this.objects) {
        if (obj.id != 'ufo') continue;
        if (obj.isInside(this.mouse.x, this.mouse.y)) {
            this.target = obj;
        }
    }
    this.ship.rotation = Math.atan2(
        this.ship.position.x - this.mouse.x,
        this.mouse.y - this.ship.position.y
    ) + Math.PI * 0.5;

    if (this.target) {
        var box = this.target.hitbox();
        this.aim.style.display = 'inline';
        this.aim.style.width = `${box.width}px`;
        this.aim.style.left = `${this.target.position.x}px`;
        this.aim.style.top = `${this.target.position.y}px`;
    } else {
        this.aim.style.display = 'none';
    }

    if ((this.keys.has(KEY_SHOOT_LASER) || mobile) && this.now - this.lastLaser > LASER_DELAY) {
        this.lastLaser = this.now;
        this.shootLaser(this.ship, this.ship.rotation)
    }

    if ((this.keys.has(KEY_SHOOT_ROCKET) || mobile) && this.now - this.lastMissile > MISSILE_DELAY && this.target) {
        this.lastMissile = this.now;
        this.shootMissile(this.ship, this.target);
    }
    
    if (this.objects.size < MAX_OBJECTS && Math.random() < UFO_PROP_SPAWN * this.dt || this.keys.has(KEY_SPAWN)) {
        var ufo = new Obj('ufo');
        var rand = Math.random();
        var sel = Math.random() < 0.5;
        ufo.position.x = (sel ? 0 : rand) * window.innerWidth;
        ufo.position.y = (sel ? rand : 0) * window.innerHeight;
        var angle = Math.random() * 2 * Math.PI;
        ufo.velocity.x = UFO_VELOCITY * Math.cos(angle);
        ufo.velocity.y = UFO_VELOCITY * Math.sin(angle);
        this.add(ufo);
    }

    for (var obj of this.objects) {
        obj.update(this.dt);
    }

    for (var obj of this.objects) {
        switch (obj.id) {
            case 'ship': {
                obj.wormhole();
                var boosting = this.keys.has(KEY_BOOST) || mobile;
                if (obj.content) {
                    obj.content.getElementById('flame').setAttribute('opacity', 1 * boosting);
                    
        }
                obj.acceleration.x = boosting * SHIP_ACCELERATION * Math.cos(obj.rotation);
                obj.acceleration.y = boosting * SHIP_ACCELERATION * Math.sin(obj.rotation);
                obj.velocity.x *= 1 - this.dt;
                obj.velocity.y *= 1 - this.dt;
                break;
            }
            case 'ufo': {
                if (obj.colliding(this.ship)) {
                    this.remove(obj);
                    this.gameOver();
                }
                if (Math.random() < UFO_PROP_LASER * this.dt) {
                    var dx = this.ship.position.x - obj.position.x;
                    var dy = this.ship.position.y - obj.position.y;
                    this.shootLaser(obj, Math.atan2(dy, dx));
                } else if (Math.random() < UFO_PROP_ROCKET * this.dt) {
                    this.shootMissile(obj, this.ship);
                }
                obj.wormhole();
                break;
            }
            case 'missile':
            case 'mymissile': {
                if (obj.target) {
                    var angle = Math.atan2(obj.target.position.y - obj.position.y, obj.target.position.x - obj.position.x);
                    var offset = angle - obj.rotation;
                    obj.rotation += Math.min(offset, Math.sign(offset) * MISSILE_TURN_ANGLE);
                }
                obj.velocity.x = MISSILE_VELOCITY * Math.cos(obj.rotation);
                obj.velocity.y = MISSILE_VELOCITY * Math.sin(obj.rotation);
                // continues at laser
            }
            case 'laser':
            case 'mylaser': {
                if (obj.outofmap()) {
                    this.remove(obj);
                } else {
                    for (var other of this.objects) {
                        if (obj.element == other.element) continue;
                        if (obj.author == other) continue;
                        if (obj.author == other.author) continue;
                        if (obj.colliding(other)) {
                            if (other == this.ship) {
                                this.remove(obj);
                                
                                this.gameOver(); 
                            }
                            else
                            {
                                this.remove(other);
                                this.remove(obj);
                                this.addPoints(Math.floor(Math.random() * 25))
                            }
                            break;
                        }
                    }
                }
                break;
            }
            default:
                break;
        }
        obj.setStyle();
    }
}
gameOver() {
    //console.log(lives);
    lives -= 1;
    livesMeter.innerHTML = lives;
        
    if(lives < 1){
        lives = LIVES;
        livesMeter.innerHTML = lives;
        for (var obj of this.objects) {
            this.remove(obj);
        }
        this.add(this.ship);
        this.running = false;
        parent.classList.remove('playing');
    }
}
animate(now) {
    if (!this.running) return;
    this.now = now;
    this.dt = (this.now - this.last) * 0.001;
    this.last = this.now;
    this.update();
    requestAnimationFrame(this.animate.bind(this));
}
start() {
    this.running = true;
    this.addPoints(-this.count);
    parent.classList.add('playing');
    requestAnimationFrame(this.animate.bind(this));
}
}
var scene = new Scene();

addEventListener('keydown', e => {scene.keys.add(e.code);})
addEventListener('keyup', e => {scene.keys.delete(e.code);})
addEventListener('mousemove', e => {
scene.mouse.x = e.clientX;
scene.mouse.y = e.clientY;
})
// TODO: Ufo laser timer
parent.addEventListener('mousedown', () => {
if (!parent.classList.contains('playing')) {
    scene.start();
}
})