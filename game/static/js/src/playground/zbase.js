class AcGamePlayground {
	constructor(root) {
		this.root = root;
		this.$playground = $(`<div class="ac-game-playground"></div>`);
		this.hide(); // 先不显示游戏界面		
		this.root.$ac_game.append(this.$playground);  // show出整个页面再初始化以下操作（可能多次show出不同的画板，所以放在start前）		
		this.start();
	}
	create_uuid() {
		let res = "";
		for (let i = 0; i < 8; i++) {
			let x = parseInt(Math.floor(Math.random() * 10));   //[0, 10)
			res += x;
		}
		return res;
	}
	start() {
		let outer = this;
		let uuid = this.create_uuid();
		$(window).on(`resize.${uuid}`, function () {
			outer.resize();
		});

		if (this.root.AcWingOS) {
			outer.root.AcWingOS.api.window.on_close(function () {
				$(window).off(`resize.${uuid}`);
			});
		}
	}
	resize() {  // 调整长宽，保证是16：9
		this.width = this.$playground.width();  // 得到当前长宽
		this.height = this.$playground.height();
		let unit = Math.min(this.width / 16, this.height / 9);  // 定义两者的最小的基准，以最小的作为基准，渲染
		this.width = unit * 16;  // 得到16：9的长宽
		this.height = unit * 9;
		this.scale = this.height;   // resize时，其他元素的渲染大小都以当前渲染的高度为基准，存为 scale 变量
		if (this.game_map) {  //如果此时地图已创建，则resize一下画布的黑框
			this.game_map.resize();
		}
	}
	show(mode) {  // 这个show的生效位置是在menu/zbase.js里面的，选择单人游戏后进入游戏界面		
		this.$playground.show();  // 打开 playground 界面
		this.width = this.$playground.width();  // 把画布大小存下来
		this.height = this.$playground.height();
		this.game_map = new GameMap(this);  // 把地图创建出来

		this.mode = mode;
		this.state = "waiting";     //waiting -> fighting -> over
		this.notice_board = new NoticeBoard(this);
		this.score_board = new ScoreBoard(this);  // 游戏结束页面
		this.player_count = 0;

		this.resize();  // 刚打开界面时，需要resize一遍 ，在game_map后面resize，把画布一起resize
		this.players = [];  // 把玩家创建出来
		this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));
		if (mode === "single mode") {
			for (let i = 0; i < 5; i++) {  //创建好 5 个人机
				this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
			}
		}
		else if (mode === "multi mode") {  // 多人模式	
			this.chat_field = new ChatField(this);  // 创建聊天
			let outer = this;
			this.mps = new MultiPlayerSocket(this);  // 创建新的端口发送请求？
			this.mps.uuid = this.players[0].uuid;
			this.mps.ws.onopen = function () {  // 用来广播我创建了一个角色（连接创建成功时，回调这个函数）
				outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
			}
		}
	}
	hide() {  //关闭 playground 界面
		//清空所有游戏元素
		while (this.players && this.players.length > 0) {
			this.players[0].destroy();
		}
		if (this.game_map) {
			this.game_map.destroy();
			this.game_map = null;
		}
		if (this.notice_board) {
			this.notice_board.destroy();
			this.notice_board = null;
		}
		if (this.score_board) {
			this.score_board.destroy();
			this.score_board = null;
		}
		this.$playground.empty();   //清空所有html标签
		this.$playground.hide();
	}
	get_random_color() {  // 人机随机颜色
		let colors = ["blue", "red", "pink", "grey", "green"];
		return colors[Math.floor(Math.random() * 5)];
	}
}
