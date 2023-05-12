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
            退出
        </div>
    </div>
</div>
`);
        // 先不直接显示menu，而是登陆成功在显示menu
        this.$menu.hide();
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
            outer.root.playground.show("single mode");   // 打开游戏界面
        });

        this.$multi_mode.click(function () {
            outer.hide();   // 关闭主页面
            outer.root.playground.show("multi mode");   // 打开游戏界面
        });

        this.$settings_mode.click(function() {
            outer.root.settings.logout_on_remote();
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

    // 动态修改长宽
    resize() {
        // 让画布的长款和窗口的长宽（16：9）保持一致
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        // 因为花板设置了不透明度，改变窗口时逐渐变黑，所以加一个特殊步骤，强制变黑
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";    // resize 完，涂一层不透明的即可
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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

}class Player extends AcGameObject {
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
    }

    start() {
        // 如果是自己就加一个监听函数
        if (this.character === "me") {
            this.add_listening_events();
        }
        // 如果是人机模式，让人机移动去随机位置
        else {
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
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
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_length = 1.0;
        let damage = 0.01;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
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
                outer.move_to((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
            }
            // 鼠标左键->释放火球
            else if (e.which === 1) {
                if (outer.cur_skill === "fireball") {
                    outer.shoot_fireball((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
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

    // 更新移动
    update_move() {

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
                let moved = Math.min(this.move_length, this.speed * this.timedelta/1000);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                // 还要减掉移动的距离
                this.move_length -= moved;
            }
        }
    }

    
    // 更新函数
    update() {
        this.update_move();
        this.render();
    }


    render(){
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
        if (this.radius < this.eps) {// 半径小于10，死亡
            this.destroy();
            return false;
        }
        // 执行击退效果
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage*100;

        this.speed *= 0.8; // 被击中后，速度减半
    }
}class FireBall extends AcGameObject {
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
class AcGamePlayground {
	constructor(root) {
		this.root = root;
		this.$playground = $(`<div class="ac-game-playground"></div>`);
		// 先不要让它直接显示
		this.hide();

		

		// show出整个页面再初始化以下操作
		// 可能多次show出不同的花板，所以放在start前
		this.root.$ac_game.append(this.$playground);
		
		
		this.start();
	}
	start() {

		// 每次用户调整窗口，都要调整大小
		let outer = this;
        $(window).resize(function() {
            outer.resize();
        });
		
	}

	// 调整长宽，保证是16：9
	resize() {
		// 得到当前长宽
        this.width = this.$playground.width();
        this.height = this.$playground.height();
		// 定义两者的最小的基准
        let unit = Math.min(this.width / 16, this.height / 9);  // 以最小的作为基准，渲染
		// 得到16：9的长宽
        this.width = unit * 16;
        this.height = unit * 9;

		// scale是一个基准，让所有元素按照scale来按比例显示
        this.scale = this.height;   // resize时，其他元素的渲染大小都以当前渲染的高度为基准，存为 scale 变量

        if (this.game_map) {
			this.game_map.resize();  //如果此时地图已创建，则resize一下画布的黑框
		}
    }

	// 这个show的生效位置是在menu/zbase.js里面的，选择单人游戏后进入游戏界面
	show(mode) {    
		//打开 playground 界面
		this.$playground.show();
		// 刚打开界面时，需要resize一遍
		// this.resize();
		// 把画布大小存下来
		this.width = this.$playground.width();
		this.height = this.$playground.height();
		// 把地图创建出来
		this.game_map = new GameMap(this);
		// 刚打开界面时，需要resize一遍 ，在game_map后面resize，把画布一起resize
		this.resize();
		// 把玩家创建出来
		this.players = [];
		this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));
		// console.log("create player");

		if (mode === "single mode") {
			//创建好 5 个人机
			for (let i = 0; i < 5; i ++ ) {
				this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
				// console.log("create robot", i);
			}
		}
		else if (mode === "multi mode") {
			
		}


		// 这样创建出来的 5 个人机是不会行动的
		// 我们写一个简易的 Ai 程序，让他们也会移动
		// 这里实现的逻辑是：每次随机一个目的地，向目的地移动，然后再随机一个目的地，循环下去
		// 根据该逻辑，修改play中的start、update、on_destroy函数即可
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
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";

        this.username = "";
        this.photo = "";


        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app5427.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");
        this.$login.hide(); // 默认关闭

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");
        this.$register.hide(); // 默认关闭


        this.$acwing_login = this.$settings.find('.ac-game-settings-acwing img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }
    start() {
        // 判断当前端口，acapp直接获取账号信息，web获取账号信息同时绘制登陆端口
        if (this.platform === "ACAPP") {
            this.getinfo_acapp();
        }
        else {
            // 从服务器端获取信息
            this.getinfo_web();
            // 监听触发了什么事件
            this.add_listening_events();
        }
    }
    add_listening_events() {    // 监听触发了什么事件
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();

        // 申请授权码code
        this.$acwing_login.click(function () {
            outer.acwing_login();
        });
    }
    add_listening_events_login() {   //跳到注册界面
        let outer = this;
        this.$login_register.click(function () {
            outer.register();
        });
        this.$login_submit.click(function () {
            outer.login_on_remote();
        });
    }
    add_listening_events_register() {      //跳到登录界面
        let outer = this;
        this.$register_login.click(function () {
            outer.login();
        })
        this.$register_submit.click(function () {
            outer.register_on_remote();
        });
    }


    // 申请授权码code
    acwing_login() {
        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: "GET",
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            }
        })
    }

    register() {    //打开注册界面
        this.$login.hide();
        this.$register.show();
    }
    login() {       //打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    // acapp 申请授权
    acapp_login(appid, redirect_uri, scope, state) {
        let outer = this;
        // 这里调用acapp的API，简单修改一下参数
        // AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, callback);
        // 这里写的回调函数是自己的resp.redirect_urreceive_codei的返回值，resp.redirect_uri在apply_code文件中写的，实际就是receive_code，我们实现的是返回用户名和头像
        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp) {
            console.log(resp);
            if (resp.result === "success") {
                // 获取到登陆账号的用户名和头像
                outer.username = resp.username;
                outer.photo = resp.photo;

                //登录成功，关闭登录界面，打开主菜单
                outer.hide();
                outer.root.menu.show();
            }
            // else {
            //     outer.login();
            // }
        });
    }

    // 从acapp服务器端获取信息
    getinfo_acapp() {
        let outer = this;
        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }


    // 从web服务器端获取信息
    getinfo_web() {
        let outer = this;
        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    // 获取到登陆账号的用户名和头像
                    outer.username = resp.username;
                    outer.photo = resp.photo;

                    //登录成功，关闭登录界面，打开主菜单
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        });
    }

    login_on_remote() {     //在远程服务器上登录
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();
        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }
        });
    }

    register_on_remote() {  //在远程服务器上注册
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    logout_on_remote() {     //在远程服务器上登出
        if (this.platform === "ACAPP") return false;
        $.ajax({
            url: "https://app5427.acapp.acwing.com.cn/settings/logout/",
            type: "GET",
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    location.reload();
                }
            }
        });
    }


    hide() {
        this.$settings.hide();
    }
    show() {
        this.$settings.show();
    }
}
export class AcGame {
    constructor(id, AcWingOS) {
        this.id = id;
        this.$ac_game = $('#' + id);

        this.AcWingOS = AcWingOS;   //如果是acapp端，该变量就会带着一系列y总提供的接口

        // 先new一个登录界面
        this.settings = new Settings(this);

        // 在写游戏界面时，先把这里注释掉，方便查看结果
        this.menu = new AcGameMenu(this);


        // 把 playground 对象也建好，这样我们就同时有两个界面了
        this.playground = new AcGamePlayground(this);

        this.start();
    }
    start() {

    }
}
