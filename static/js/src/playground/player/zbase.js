class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me) {
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
        this.is_me = is_me;
        // 记录当前释放的技能
        this.cur_skill = null;
        // 用于浮点数计算
        this.eps = 0.1;
        this.friction = 0.9; // 为了让碰撞后，刚开始很慢，逐渐恢复速度
        this.spent_time = 0; // 初始人机攻击冷却时间

    }

    start() {
        // 如果是自己就加一个监听函数
        if (this.is_me) {
            this.add_listening_events();
        }
        // 如果是人机模式，让人机移动去随机位置
        else {
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;
            this.move_to(tx, ty);

        }
    }

    // 求两点的欧几里得距离
    get_dist(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }


    // 移动策略
    move_to(tx, ty) {
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

    // 确定火球的参数
    shoot_fireball(tx, ty) {

        let x = this.x, y = this.y; //火球发射点就是当前玩家的位置
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1.0;
        let damage = this.playground.height * 0.01;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height*0.01);
    }

    // 监听输入参数
    add_listening_events() {
        let outer = this;
        // 把鼠标右键默认菜单这一事件默认返回false，方便我们设计自己的操作
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });

        // 鼠标事件
        this.playground.game_map.$canvas.mousedown ( function(e) {
            /// 得到画布位置
            const rect = outer.ctx.canvas.getBoundingClientRect(); 
            // 鼠标右键->移动
            if (e.which === 3) {
                outer.move_to(e.clientX - rect.left, e.clientY - rect.top);
            }
            // 鼠标左键->释放火球
            else if (e.which === 1) {
                if (outer.cur_skill === "fireball") {
                    outer.shoot_fireball(e.clientX - rect.left, e.clientY - rect.top);
                }
                // 清空技能选项
                outer.cur_skill = null;
            }
        });

        // 键盘事件
        $(window).keydown ( function(e) {
            if (e.which === 81 ) {
                outer.cur_skill = "fireball";
                return false;
            }

        });
    }

    
    // 更新函数
    update() {
        // 人机随机发射炮弹
        this.spent_time += this.timedelta / 1000;
        if (!this.is_me && this.spent_time > 4 && Math.random() * 180 < 1) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            this.shoot_fireball(player.x, player.y);
        }

        // 被打中了，哦豁，呆着吧
        if (this.damage_speed > 10) {
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
                if (!this.is_me) {
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
                    this.move_to(tx, ty);
                }
            }
            // 朝着目标前进
            else {
                // 计算单位帧里的移动距离
                let moved = Math.min(this.move_length, this.speed * this.timedelta/1000);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                // 还要减掉移动的距离
                this.move_length -= moved;
            }
        }
        this.render();
    }


    render(){

        // 渲染一个圆
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }


    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i ++ ) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
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
        for (let i = 0; i < 10+Math.random()*5; i++) {
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random()*0.1;
            let angle = 2*Math.PI * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed);
        }

        // 击退功能
        this.radius -= damage; // 受伤，半径减少
        if (this.radius < 10) {// 半径小于10，死亡
            this.destroy();
            return false;
        }
        // 执行击退效果
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage*100;

        this.speed *= 0.8; // 被击中后，速度减半
    }
}
