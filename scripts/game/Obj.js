export default class Obj {
    constructor(id) {
        this.id = id
        this.element = document.getElementById(id).cloneNode()

        this.element.onload = () => {
            this.content = this.element.contentDocument
        }

        this.position = { x: 0, y: 0 }
        this.velocity = { x: 0, y: 0 }
        this.acceleration = { x: 0, y: 0 }
        this.rotation = 0
    }
    update(dt) {
        this.velocity.x += this.acceleration.x * dt
        this.velocity.y += this.acceleration.y * dt

        this.position.x += this.velocity.x * dt
        this.position.y += this.velocity.y * dt
    }
    setStyle() {
        this.element.style.left = `${this.position.x}px`
        this.element.style.top = `${this.position.y}px`
        this.element.style.transform = `translate(-50%,-50%) rotate(${this.rotation}rad)`
    }
    hitbox() {
        return this.element.getBoundingClientRect()
    }
    swapSpeed() {
        let temp

        temp = this.velocity.x
        this.velocity.x = this.velocity.y
        this.velocity.y = temp

        temp = this.acceleration.x
        this.acceleration.x = this.acceleration.y
        this.acceleration.y = temp
    }
    wormhole() {
        if (this.position.x < 0 || this.position.x >= window.innerWidth) {
            //this.swapSpeed();
            //this.position.x = this.position.y / window.innerHeight * window.innerWidth;
            //this.position.y = this.velocity.y > 0 ? 0 : window.innerHeight - 1;
            this.position.x = (window.innerWidth - 1) * (this.position.x < 0)
        }

        if (this.position.y < 0 || this.position.y >= window.innerHeight) {
            //this.swapSpeed();
            //this.position.y = this.position.x / window.innerWidth * window.innerHeight;
            //this.position.x = this.velocity.x > 0 ? 0 : window.innerWidth - 1;
            this.position.y = (window.innerHeight - 1) * (this.position.y < 0)
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
        let a = this.hitbox()
        let b = obj.hitbox()
        return !(
            a.top + a.height < b.top ||
            a.top > b.top + b.height ||
            a.left + a.width < b.left ||
            a.left > b.left + b.width
        )
    }
    isInside(x, y) {
        let rect = this.hitbox()
        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        )
    }
}
