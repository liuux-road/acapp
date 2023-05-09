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