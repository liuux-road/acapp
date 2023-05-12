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
