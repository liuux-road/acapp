class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $('<canvas tabindex=0></canvas>');  // 将 keydown 监听事件绑定到 canvas 上
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);

    }

    start() {
        this.$canvas.focus();  // 将 keydown 监听事件绑定到 canvas 上
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
