let AC_GAME_OBJECTS = [];
class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);
        this.has_called_start = false;  // 标记一下有没有执行过start函数
        this.timedelta = 0;  // 当前距离上一帧的时间间隔,下面还要记录一下下一帧的时间间隔
        this.uuid = this.create_uuid();  // 为了练联机对战，每个人创建一个随机编号
    }
    create_uuid() {  // 创建唯一编号
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10));   //[0, 10)
            res += x;
        }
        return res;
    }
    start() {  // 第一帧执行一次
    }
    update() {  // 每一帧均会执行一次
    }
    late_update() { //每一帧均会执行一次，且在所有 update 执行完后才执行
    }
    on_destroy() {  // 在被销毁前执行一次
    }
    destroy() {  // 删掉该物体时执行一次
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

    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {  // 在调用完其他功能后，最后渲染的部分
        let obj = AC_GAME_OBJECTS[i];
        obj.late_update();
    }

    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}
requestAnimationFrame(AC_GAME_ANIMATION);
