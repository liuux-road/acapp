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
