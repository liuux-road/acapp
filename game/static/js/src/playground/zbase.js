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
			let outer = this;

			this.mps = new MultiPlayerSocket(this);
			// 这个函数时连接创建成功时，回调这个函数
			console.log("zhiixngle");
            this.mps.ws.onopen = function() {
            	outer.mps.send_create_player();
			}
			
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
