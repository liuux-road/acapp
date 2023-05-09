export class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id);
        // 在写游戏界面时，先把这里注释掉，方便查看结果
        this.menu = new AcGameMenu(this);


        // 把 playground 对象也建好，这样我们就同时有两个界面了
        this.playground = new AcGamePlayground(this);

        this.start();
    }
    start() {

    }
}
