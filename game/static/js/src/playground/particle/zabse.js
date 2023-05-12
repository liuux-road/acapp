// 实现逻辑：被击中以后，在玩家附近随机生成一些粒子小球
// 因此我们要先实现 粒子小球 对象
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.friction = 0.9;
        this.eps = 0.01;
    }
    start() {

    }
    update() {
        if(this.speed < this.eps) {
            this.destroy;
            return false;
        }
        this.x += this.vx*this.speed*this.timedelta/1000;
        this.y += this.vy*this.speed*this.timedelta/1000;
        this.speed *= this.friction;

        this.render();
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, 2*Math.PI, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}