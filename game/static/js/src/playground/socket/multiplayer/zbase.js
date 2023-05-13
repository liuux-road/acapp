class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;
        this.ws = new WebSocket("wss://app5427.acapp.acwing.com.cn/wss/multiplayer/");
        this.start();
    }
    start() {
        this.receive();
    }
    receive() {  // 从前端接收信息。等待接收信息，并判断怎么执行
        let outer = this;
        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);  // 将收到的JSON还原成字典格式，再处理
            let uuid = data.uuid;
            if (uuid === outer.uuid) return false;  // 如果是自己发的消息，不接收
            let event = data.event;
            if (event === "create_player") {  // 有用户创建了角色，调用函数
                outer.receive_create_player(uuid, data.username, data.photo);  
            }
            else if (event === "move_to") {  // 角色移动事件，调用函数
                outer.receive_move_to(uuid, data.tx, data.ty);
            }
            else if (event === "shoot_fireball") {  // 火球添加事件，调用函数
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
            }            
            else if (event === "attack") {  // 火球击中事件，调用函数
                outer.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            }
            else if (event === "blink") {  // 闪现事件，调用函数
                outer.receive_blink(uuid, data.tx, data.ty);
            }
            else if (event === "message") {  // 闪现事件，调用函数
                outer.receive_message(data.username, data.text);
            }
        };
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
    receive_create_player(uuid, username, photo) {  // 接收广播信息-有新角色加入，创建
        let player = new Player(this.playground, this.playground.width / 2 / this.playground.scale,
            0.5, 0.05, "white", 0.15, "enemy", username, photo);
        player.uuid = uuid;  // uuid从创建端发送过来
        this.playground.players.push(player);
    }
    send_move_to(tx, ty) {  // 广播，移动信息
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': 'move_to',
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }
    get_player(uuid) {  // 找到uuid对应的角色
        let players = this.playground.players;
        for (let i = 0; i < players.length; i ++ ) {
            let player = players[i];
            if (player.uuid === uuid) {
                return player;
            }
        }
        return null;
    }
    receive_move_to(uuid, tx, ty) {  // 角色移动事件，调用函数
        let player = this.get_player(uuid); // 遍历找到uuid对应的角色，再将其移动
        if (player) {
            player.move_to(tx, ty);
        }
    }
    send_shoot_fireball(tx, ty, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': 'shoot_fireball',
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,
        }));
    }
    receive_shoot_fireball(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid;
        }
    }
    send_attack(attackee_uuid, x, y, angle, damage, ball_uuid) {  // 攻击技能触发
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }
    receive_attack(uuid, attackee_uuid, x, y, angle, damage, ball_uuid) {
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if (attacker && attackee) {
            attackee.receive_attack(x, y, angle, damage, ball_uuid, attacker);
        }
    }
    send_blink(tx, ty) {  // 闪现技能
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }
    receive_blink(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }
    send_message(text) {  // 聊天框
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "message",
            'uuid': outer.uuid,
            'username': outer.playground.root.settings.username,
            'text': text,
        }));
    }
    receive_message(username, text) {
        this.playground.chat_field.add_message(username, text);
    }
}