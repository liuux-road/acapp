export class AcGame {
    constructor(id, AcWingOS) {
        this.id = id;
        this.$ac_game = $('#' + id);

        this.AcWingOS = AcWingOS;   //如果是acapp端，该变量就会带着一系列y总提供的接口

        // 先new一个登录界面
        this.settings = new Settings(this);

        // 在写游戏界面时，先把这里注释掉，方便查看结果
        this.menu = new AcGameMenu(this);


        // 把 playground 对象也建好，这样我们就同时有两个界面了
        this.playground = new AcGamePlayground(this);

        this.start();
    }
    start() {

    }
}
