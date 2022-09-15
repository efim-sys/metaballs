import Obj from "./Obj.js"
import Constants from "./Constants.js"

const {
    KEY_BOOST,
    KEY_SHOOT_LASER,
    KEY_SHOOT_ROCKET,
    MAX_OBJECTS,
    SHIP_ACCELERATION,
    MISSILE_VELOCITY,
    MISSILE_DELAY,
    MISSILE_TURN_ANGLE,
    LASER_VELOCITY,
    LASER_DELAY,
    UFO_VELOCITY,
    UFO_PROP_SPAWN,
    UFO_PROP_LASER,
    UFO_PROP_ROCKET,
    LIVES,
    SHIELD_PROP_SPAWN,
    SHIELD_PROP_DURATION,
} = Constants

export default class Scene {
    constructor() {
        window.lives = LIVES
        window.livesMeter.innerHTML = window.lives

        this.running = true
        this.objects = new Set()
        this.count = 0

        this.now = 0
        this.last = 0
        this.dt = 0

        this.lastLaser = 0
        this.lastMissile = 0

        this.mouse = { x: 0, y: 0 }
        this.keys = new Set()

        this.aim = document.getElementById("target")
        this.score = document.getElementById("score")
        this.target = undefined
    }
    /**
     *
     * @param {Number} points Number of points to add
     */
    addPoints(points) {
        this.count += points
        if (this.count > window.highScore) {
            window.window.highScore = this.count
            window.window.highMeter.innerHTML = window.window.highScore
        }
        this.score.innerHTML = this.count
    }
    add(obj) {
        this.objects.add(obj)
        window.parent.appendChild(obj.element)
    }
    remove(obj) {
        this.objects.delete(obj)
        window.parent.removeChild(obj.element)
        if (obj.id === "shield") this.shieldSpawned = false
    }
    shootLaser(author, direction) {
        let laser = author.id === "ship" ? new Obj("mylaser") : new Obj("laser")
        laser.position.x = author.position.x
        laser.position.y = author.position.y
        laser.rotation = direction
        laser.velocity.x = LASER_VELOCITY * Math.cos(direction)
        laser.velocity.y = LASER_VELOCITY * Math.sin(direction)
        laser.author = author
        this.add(laser)
    }
    shootMissile(author, target) {
        let missile =
            author.id === "ship" ? new Obj("mymissile") : new Obj("missile")
        missile.position.x = author.position.x
        missile.position.y = author.position.y
        missile.rotation = author.rotation
        missile.author = author
        missile.target = target
        this.add(missile)
    }
    update() {
        this.target = undefined
        if (Date.now() - this.ship.gotshield > SHIELD_PROP_DURATION)
            this.ship.shield = false

        for (let obj of this.objects) {
            if (obj.id != "ufo") continue
            if (obj.isInside(this.mouse.x, this.mouse.y)) {
                this.target = obj
            }
        }
        this.ship.rotation =
            Math.atan2(
                this.ship.position.x - this.mouse.x,
                this.mouse.y - this.ship.position.y
            ) +
            Math.PI * 0.5

        if (this.target) {
            let box = this.target.hitbox()
            this.aim.style.display = "inline"
            this.aim.style.width = `${box.width}px`
            this.aim.style.left = `${this.target.position.x}px`
            this.aim.style.top = `${this.target.position.y}px`
        } else {
            this.aim.style.display = "none"
        }

        if (
            (this.keys.has(KEY_SHOOT_LASER) || window.mobile) &&
            this.now - this.lastLaser > LASER_DELAY
        ) {
            this.lastLaser = this.now
            this.shootLaser(this.ship, this.ship.rotation)
        }

        if (
            (this.keys.has(KEY_SHOOT_ROCKET) || window.mobile) &&
            this.now - this.lastMissile > MISSILE_DELAY &&
            this.target
        ) {
            this.lastMissile = this.now
            this.shootMissile(this.ship, this.target)
        }

        if (
            this.objects.size < MAX_OBJECTS &&
            Math.random() < UFO_PROP_SPAWN * this.dt
        ) {
            let ufo = new Obj("ufo")
            let rand = Math.random()
            let sel = Math.random() < 0.5
            ufo.position.x = (sel ? 0 : rand) * window.innerWidth
            ufo.position.y = (sel ? rand : 0) * window.innerHeight
            let angle = Math.random() * 2 * Math.PI
            ufo.velocity.x = UFO_VELOCITY * Math.cos(angle)
            ufo.velocity.y = UFO_VELOCITY * Math.sin(angle)

            console.log(ufo)

            this.add(ufo)
        }

        if (
            this.objects.size < MAX_OBJECTS &&
            Math.random() < SHIELD_PROP_SPAWN &&
            !this.ship.shield &&
            !this.shieldSpawned
        ) {
            this.shieldSpawned = true
            let shield = new Obj("shield")
            shield.position.x = Math.random() * window.innerWidth
            shield.position.y = Math.random() * window.innerHeight

            console.log(shield)

            this.add(shield)
        }

        for (let obj of this.objects) {
            obj.update(this.dt)
        }

        for (let obj of this.objects) {
            switch (obj.id) {
                case "ship": {
                    obj.wormhole()
                    let boosting = this.keys.has(KEY_BOOST) || window.mobile
                    if (obj.content) {
                        obj.content
                            .getElementById("flame")
                            .setAttribute("opacity", 1 * boosting)
                    }
                    obj.acceleration.x =
                        boosting * SHIP_ACCELERATION * Math.cos(obj.rotation)
                    obj.acceleration.y =
                        boosting * SHIP_ACCELERATION * Math.sin(obj.rotation)
                    obj.velocity.x *= 1 - this.dt
                    obj.velocity.y *= 1 - this.dt
                    break
                }
                case "shield": {
                    if (obj.colliding(this.ship)) {
                        this.shieldSpawned = true
                        this.remove(obj)
                        this.ship.shield = true
                        this.ship.gotshield = Date.now()

                        let border = new Obj("border")
                        border.position = this.ship.position

                        this.add(border)
                    }
                    break
                }
                case "border": {
                    if (!this.ship.shield) {
                        this.remove(obj)
                        break
                    }
                    obj.position = this.ship.position
                    break
                }
                case "ufo": {
                    if (obj.colliding(this.ship)) {
                        this.remove(obj)
                        this.gameOver()
                    }
                    if (Math.random() < UFO_PROP_LASER * this.dt) {
                        let dx = this.ship.position.x - obj.position.x
                        let dy = this.ship.position.y - obj.position.y
                        this.shootLaser(obj, Math.atan2(dy, dx))
                    } else if (Math.random() < UFO_PROP_ROCKET * this.dt) {
                        this.shootMissile(obj, this.ship)
                    }
                    obj.wormhole()
                    break
                }
                case "missile":
                case "mymissile": {
                    if (obj.target) {
                        let angle = Math.atan2(
                            obj.target.position.y - obj.position.y,
                            obj.target.position.x - obj.position.x
                        )
                        let offset = angle - obj.rotation
                        obj.rotation += Math.min(
                            offset,
                            Math.sign(offset) * MISSILE_TURN_ANGLE
                        )
                    }
                    obj.velocity.x = MISSILE_VELOCITY * Math.cos(obj.rotation)
                    obj.velocity.y = MISSILE_VELOCITY * Math.sin(obj.rotation)
                    // continues at laser
                }
                case "laser":
                case "mylaser": {
                    if (obj.outofmap()) {
                        this.remove(obj)
                    } else {
                        for (let other of this.objects) {
                            if (obj.element == other.element) continue
                            if (obj.author == other) continue
                            if (obj.author == other.author) continue
                            if (obj.colliding(other)) {
                                if (other == this.ship) {
                                    this.remove(obj)

                                    this.gameOver()
                                } else {
                                    if (
                                        other.id !== "border" &&
                                        other.id !== "shield"
                                    ) {
                                        this.remove(other)
                                        this.remove(obj)
                                        this.addPoints(
                                            Math.floor(Math.random() * 25)
                                        )
                                    }
                                }
                                break
                            }
                        }
                    }
                    break
                }
                default:
                    break
            }
            obj.setStyle()
        }
    }
    gameOver() {
        //console.log(window.lives);
        if (!this.ship.shield) window.lives -= 1
        window.livesMeter.innerHTML = window.lives

        if (window.lives < 1) {
            window.lives = LIVES
            window.livesMeter.innerHTML = window.lives
            for (let obj of this.objects) {
                this.remove(obj)
            }
            delete this.ship
            this.running = false
            window.parent.classList.remove("playing")
        }
    }
    animate(now) {
        if (!this.running) return
        this.now = now
        this.dt = (this.now - this.last) * 0.001
        this.last = this.now
        this.update()
        requestAnimationFrame(this.animate.bind(this))
    }
    start() {
        this.running = true

        window.lives = LIVES
        window.livesMeter.innerHTML = window.lives

        this.ship = new Obj("ship")

        this.ship.shield = false
        this.shieldSpawned = false

        this.ship.position.x = window.innerWidth / 2
        this.ship.position.y = window.innerHeight / 2
        this.add(this.ship)

        this.addPoints(-this.count)
        window.parent.classList.add("playing")
        requestAnimationFrame(this.animate.bind(this))
    }
}
