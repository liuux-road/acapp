class FireBall extends AcGameObject {
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;// 伤害值
        this.eps = 0.01;
    }

    start() {

    }

    update() {
        if(this.move_length < this.eps) {
            this.destroy();
            return false;
        }
        else {
            // 移动操作
            let moved = Math.min(this.move_length, this.speed * this.timedelta/1000);
            this.x += this.vx * moved;
            this.y += this.vy * moved;
            this.move_length -= moved;

            // 实现逻辑：检测两个圆的中心距离是否小于两个圆的半径之和
            // 小于等于时，代表发生碰撞，开始执行命中效果：
            // 被击中用户掉血
            // 被击中用户收到向后击退效果
            // 碰撞检测写在火球类里，击退效果写在玩家类里
            for (let i = 0; i < this.playground.players.length; i++) {
                let player = this.playground.players[i];
                // 碰撞发生一定是在非施法者身上，同时检测两球距离
                if (this.player !== player && this.is_collision(player)) {
                    this.attack(player);
                }
            }
        }
        this.render();

    }


    render() {

    let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, 2*Math.PI, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();

    }

    // 求两点的欧几里得距离
    get_dist(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 检测两个圆的圆心距离是否小于半径之和
    is_collision(player) {
        let distance = this.get_dist(this.x, this.y, player.x, player.y);
        if (distance < (this.radius + player.radius))
            return true;
        return false;
    }

    // 执行击退效果
    attack(player) {
        let angle = Math.atan2(player.y-this.y, player.x-this.x);
        player.is_attacked(angle, this.damage); // 火球命中，目标玩家执行击退效果
        this.destroy(); // 火球命中后，自然消失
    }
}
