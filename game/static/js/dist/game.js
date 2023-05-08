class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings-mode">
            设置
        </div>
    </div>
</div>
`);
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings_mode = this.$menu.find('.ac-game-menu-field-item-settings-mode');

        this.start();
    }
    start() {
        this.add_listening_events();
    }
    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function () {
            outer.hide();   // 关闭主页面
            outer.root.playground.show();   // 打开游戏界面
        });
    }

    show() {    //显示menu界面
        this.$menu.show();
    }
    hide() {    //隐藏menu界面
        this.$menu.hide();
    }
}
let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);
        // 标记一下有没有执行过start函数
        this.has_called_start = false;
        // 当前距离上一帧的时间间隔,下面还要记录一下下一帧的时间间隔
        this.timedelta = 0;
    }

    // 第一帧执行一次
    start() {

    }

    // 每一帧均会执行一次
    update() {

    }

    // 在被销毁前执行一次
    on_destroy() {

    }

    // 删掉该物体时执行一次
    destroy() {
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
            if (AC_GAME_OBJECTS[i] === this) {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }
}


let last_timestamp;
// 让每一帧循环数组里的所有对象
// 这个函数在一秒钟调用60次
let AC_GAME_ANIMATION = function (timestamp) {
    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        }
        else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}
requestAnimationFrame(AC_GAME_ANIMATION);
class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $('<canvas></canvas>');
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);

    }

    start() {

    }

    update() {
        this.render(); // 每一帧都画一次，所以在这里执行

    }

    // 渲染函数
    render() {
        // 先画一个矩形，黑色，半透明实现小球尾部的动效
        this.ctx.fillStyle = "rgba(0,0,0,0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    }
}
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}class Player extends AcGameObject {
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
        console.log("move_to", tx, ty);
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
            // 鼠标右键->移动
            if (e.which === 3) {
                outer.move_to(e.clientX, e.clientY);
            }
            // 鼠标左键->释放火球
            else if (e.which === 1) {
                if (outer.cur_skill === "fireball") {
                    outer.shoot_fireball(e.clientX, e.clientY);
                }
            }

            // 清空技能选项
            outer.cur_skill = null;
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
        this.eps = 0.1;
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
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
class AcGamePlayground {
	constructor(root) {
		this.root = root;
		this.$playground = $(`<div class="ac-game-playground"></div>`);

		// this.hide();
		this.root.$ac_game.append(this.$playground);
		// 把画布大小存下来
		this.width = this.$playground.width();
		this.height = this.$playground.height();
		// 把地图创建出来
		this.game_map = new GameMap(this);
		// 把玩家创建出来
		this.players = [];
		this.players.push(new Player(this, this.width/2, this.height/2, this.height*0.05, "white", this.height*0.15, true));


		this.start();
		//创建好 5 个人机
		for (let i = 0; i < 5; i ++ ) {
			this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, this.get_random_color(), this.height * 0.15, false));
		}
		// 这样创建出来的 5 个人机是不会行动的
		// 我们写一个简易的 Ai 程序，让他们也会移动
		// 这里实现的逻辑是：每次随机一个目的地，向目的地移动，然后再随机一个目的地，循环下去
		// 根据该逻辑，修改play中的start、update、on_destroy函数即可
	}
	start() {

	}
	show() {    //打开 playground 界面
		this.$playground.show();
	}
	hide() {    //关闭 playground 界面
		this.$playground.hide();
	}

    // 人机随机颜色
    get_random_color() {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * 5)];
    }

}
export class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id);
        // 在写游戏界面时，先把这里注释掉，方便查看结果
        // this.menu = new AcGameMenu(this);


        // 把 playground 对象也建好，这样我们就同时有两个界面了
        this.playground = new AcGamePlayground(this);

        this.start();
    }
    start() {

    }
}
