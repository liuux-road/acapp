class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;
        this.ws = new WebSocket("wss://app5427.acapp.acwing.com.cn/wss/multiplayer/");
        this.start();
    }
    start() {
        this.receive();
    }
    send_create_player(username, photo) {  // 广播，我这里创建了一个角色，发送角色uuid。进入多人游戏时调用这个函数
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': 'create_player',
            'uuid': outer.uuid,  // uuid是自己生成的
            'username': username,  // username需要手动传
            'photo': photo,  // photo需要手动传
        }));
    }
    receive() {  // 从前端接收信息。等待接收信息，并判断怎么执行
        let outer = this;
        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);  // 将收到的JSON还原成字典格式，再处理
            let uuid = data.uuid;
            if (uuid === outer.uuid) return false;  // 如果是自己发的消息，不接收
            let event = data.event;
            if (event === "create_player") {  
                outer.receive_create_player(uuid, data.username, data.photo);  // 有用户创建了角色，调用函数
            }
        };
    }
    receive_create_player(uuid, username, photo) {  // 接收广播信息-有新角色加入，创建
        let player = new Player(this.playground, this.playground.width / 2 / this.playground.scale,
            0.5, 0.05, "white", 0.15, "enemy", username, photo);
        player.uuid = uuid;  // uuid从创建端发送过来
        this.playground.players.push(player);
    }
}