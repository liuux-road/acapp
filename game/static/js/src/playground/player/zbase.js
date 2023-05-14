class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.cur_skill = null; // 记录当前释放的技能
        this.eps = 0.01; // 用于浮点数计算
        this.friction = 0.9; // 为了让碰撞后，刚开始很慢，逐渐恢复速度
        this.spent_time = 0; // 初始人机攻击冷却时间
        if (this.character !== "robot") { // 对于玩家和敌人，有头像这个属性
            this.img = new Image();
            this.img.src = this.photo;
        }
        this.fireballs = [];    // 存该用户发射的所有火球
        if (this.character === "me") {  // 游戏开始前以及技能的冷却时间
            this.fireball_coldtime = 3; // 单位：s
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";
        }
        if (this.character === "me") {  // 闪现技能的冷却时间
            this.blink_coldtime = 5;
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }
    start() {
        this.playground.player_count++;
        console.log("this.playground.player_count = ", this.playground.player_count);
        this.playground.notice_board.write("已就绪@：" + this.playground.player_count + "人");
        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }


        if (this.character === "me") {  // 如果是自己就加一个监听函数
            this.add_listening_events();
        }
        else if (this.character === "robot") {  // 如果是人机模式，让人机移动去随机位置
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }
    get_dist(x1, y1, x2, y2) {  // 求两点的欧几里得距离
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    move_to(tx, ty) {  // 移动策略
        // 计算移动距离
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        // 计算移动角度， api接口：atan2(dy,dx)
        let angle = Math.atan2(ty - this.y, tx - this.x);
        // 位移一个单位长度，向着矢量方向移动到单位圆上
        // 极直互化
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
        // console.log("move_to", tx, ty);
    }
    shoot_fireball(tx, ty) {  // 确定火球的参数
        let x = this.x, y = this.y; //火球发射点就是当前玩家的位置
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_length = 1.0;
        let damage = 0.01;
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
        this.fireballs.push(fireball);  // 火球数组中添加新火球
        // this.fireball_coldtime = 0.1;  // 为什么无限活力没作用
        return fireball;
    }
    destroy_fireball(uuid) {  // 火球消失
        for (let i = 0; i < this.fireballs.length; i++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid == uuid) {
                fireball.destroy();
                break;
            }
        }
    }
    receive_attack(x, y, angle, damage, ball_uuid, attacker) {
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }
    add_listening_events() {  // 监听输入参数
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function () {  // 把鼠标右键默认菜单这一事件默认返回false，方便我们设计自己的操作
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function (e) {  // 鼠标事件
            if (outer.playground.state !== "fighting")
                return false;

            const rect = outer.ctx.canvas.getBoundingClientRect();  // 得到画布位置
            if (e.which === 3) {  // 鼠标右键->移动
                outer.move_to((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                }
            }
            else if (e.which === 1) {  // 鼠标左键->释放技能
                if (outer.cur_skill === "fireball") {
                    if (outer.fireball_coldtime > outer.eps)
                        return false;
                    let fireball = outer.shoot_fireball((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale, fireball.uuid);
                    }
                    outer.fireball_coldtime = 3;
                }
                else if (outer.cur_skill === "blink") {
                    if (outer.blink_coldtime > outer.eps)
                        return false;
                    outer.blink((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                    // 同步函数
                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                    }
                    outer.blink_coldtime = 5;
                }
                outer.cur_skill = null;  // 清空技能选项
            }
        });
        this.playground.game_map.$canvas.keydown(function (e) {  // 键盘事件
            if (e.which === 13) {   // enter (显示对话框)
                if (outer.playground.mode === "multi mode") {
                    outer.playground.chat_field.show_input();
                    return false;
                }
            } else if (e.which === 27) {    //esc（关闭对话框）
                if (outer.playground.mode === "multi mode") {
                    outer.playground.char_field.hide_input();
                    return false;
                }
            }
            if (outer.playground.state !== "fighting")
                return true;
            if (e.which === 81) {    //q键
                if (outer.fireball_coldtime >= outer.eps)
                    return true;
                outer.cur_skill = "fireball";
                return false;
            }
            else if (e.which === 70) {    //f键
                if (outer.blink_coldtime >= outer.eps)
                    return true;
                outer.cur_skill = "blink";
                return false;
            }
        });
    }
    update_move() {  // 更新移动
        // 人机随机发射炮弹
        this.spent_time += this.timedelta / 1000;
        if (this.character === "robot" && this.spent_time > 4 && Math.random() * 180 < 1) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            this.shoot_fireball(player.x, player.y);
        }

        // 被打中了，哦豁，呆着吧
        if (this.damage_speed > this.eps) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
        }
        else {
            // 距离太短就不动了
            if (this.move_length < this.eps) {
                this.move_length = 0;
                this.vx = 0;
                this.vy = 0;
                // 如果是人机，让它继续移动
                if (this.character === "robot") {
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
                    this.move_to(tx, ty);
                }
            }
            else {
                // 计算单位帧里的移动距离
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                // 还要减掉移动的距离
                this.move_length -= moved;
            }
        }
    }
    blink(tx, ty) {  // 闪现技能
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;  // cd:5s
        this.move_length = 0;   //闪现完停下来

    }
    update_win() {
        // 竞赛状态，且只有一名玩家，且改名玩家就是我，则胜利
        if (this.playground.state === "fighting" && this.character === "me" && this.playground.players.length === 1) {
            this.playground.state = "over";
            this.playground.score_board.win();
        }
    }
    update() {  // 更新函数
        this.update_win();
        this.update_move();
        if (this.character === "me" && this.playground.state === "fighting") {
            this.update_coldtime();
        }
        this.render();
    }
    update_coldtime() {  // 更新技能冷却
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(0, this.fireball_coldtime);
        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(0, this.blink_coldtime);
    }
    render_skill_coldtime() {  // 渲染火球技能的冷却
        let scale = this.playground.scale;
        let x = 1.5, y = 0.9, r = 0.04;

        // 渲染技能图标
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        // 渲染冷却指示
        if (this.fireball_coldtime >= this.eps) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

        x = 1.62, y = 0.9, r = 0.04;
        // 闪现技能
        // 渲染技能图标
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        // 渲染冷却指示
        if (this.blink_coldtime >= this.eps) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
    }
    render() {  // 动态渲染
        let scale = this.playground.scale;
        if (this.character !== "robot") {
            // 这是玩家或敌人，渲染头像
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            // console.log(this.img);
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale,
                this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        }
        else {
            // 这是人机，渲染一个圆
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if (this.character === "me" && this.playground.state === "fighting") {  // 渲染火球技能的冷却
            this.render_skill_coldtime();
        }
    }
    on_destroy() {
        // 我死亡，且游戏处于竞赛状态，则失败
        if (this.character === "me" && this.playground.state === "fighting") {
            this.playground.state = "over"
            this.playground.score_board.lose();
        }
        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }

    }

    // 实现逻辑：检测两个圆的中心距离是否小于两个圆的半径之和
    // 小于等于时，代表发生碰撞，开始执行命中效果：
    // 被击中用户掉血
    // 被击中用户收到向后击退效果
    // 碰撞检测写在火球类里，击退效果写在玩家类里    
    is_attacked(angle, damage) {
        // 然后我们在被击退功能模块，实现生成粒子小球的效果
        // 粒子小球释放弧度为[0,2π)的随机数
        // 粒子小球的 x, y 分量比率根据弧度来设定
        // 粒子小球的起始坐标应与玩家的坐标相同
        // 粒子小球的颜色与玩家颜色相同
        // 粒子小球的速度为玩家移动速度的10倍
        for (let i = 0; i < 10 + Math.random() * 5; i++) {
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = 2 * Math.PI * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed);
        }

        // 击退功能
        this.radius -= damage; // 受伤，半径减少
        if (this.radius < this.eps) {// 半径小于10，死亡
            this.destroy();
            return false;
        }
        // 执行击退效果
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;

        this.speed *= 0.8; // 被击中后，速度减半
    }
}