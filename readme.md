# 一个伟大的史诗级巨著！！！
### 2. 配置docker、git环境与项目创建
over
### 3. 创建菜单界面
over
### 4. 创建游戏界面
* edge浏览器缓存->页面无法正常显示
* edge浏览器->console.log无法正常显示
* chrom浏览器 隐私模式 YYDS
* （还有代码敲错。。。->无法正常显示hh）<br>
==这一章直接写了两天，加快速速度--------------------------》==<br>
over
### 5. 部署nginx与对接acapp
就是一个将程序连接到网页，发布的过程<br>
期间买了188，10年的liuux.top域名，等待工信部审核通过，就可以用啦haaaaaa
### 6. 创建账号系统
`参考：https://www.acwing.com/activity/content/code/content/2281719/`
##### 6.1 用户密码登录
只完成了 
* 创建用户表
* 实现客户端类型判别
* 构建登陆功能框架（路由建立好以后，访问 xxxx/settings/getinfo，可以看到 getinfo.py 返回的 JSON 类型的 JSONResponse）<br>
只完成到这里，问题：
```shell
elif platform == "WEB":
        return getinfo_web(request)
```
模仿来的elif是最新的，这里要用else。hh<br>
23.5.10上传<br>
23/5/9完成<br>
完成：登陆注册页面、登陆注册功能<br>
2023/5/10
##### 6.2 Web端AcWing一键登录
* 第一步 申请授权码code(settings/zbash.js中调用apply_code)
* 第二步 申请授权令牌access_token和用户的openid（上一步信息反馈到receive_code中，并申请授权和用户id）
* 第三步 申请用户信息（receive_code中，申请授权得到用户信息）<br>
over   2023/5/10
##### 6.3 AcAPP端AcWing一键登录
1. acapp端注册功能函数：`js/src/settings/zbase.js`
2. 申请授权：`views/settings/acwing/acapp/apply_code.py`
3. 接收账号信息：`views/settings/acwing/acapp/receive_code.py`
4. 添加路由信息：`urls/settings/acwing/index.py`
over<br>
2023/5/12（11号上午组会，下午上课，晚上聚餐，鸽了一天）
### 7. 实现连接对战
1. 统一长度单位
地图 16:9 等比例缩放`js/src/playground/zbase.js`;`js/src/playground/game_map/zbase.js`;`css/game.css`;`js/src/playground/game_map/zbase.js`<br>
玩家 Player 缩放渲染`js/src/playground/zbase.js`;`js/src/playground/player/zbase.js`;<br>
火球 Fireball 缩放渲染`js/src/playground/skill/fireball/zbase.js`<br>
粒子 particle 缩放渲染`js/src/playground/particle/zbase.js`<br>
2023/5/12 over<br>
问题：可能是浏览器刷新不彻底，导致缩放的小球一直不显示出来；另外有一个bug就是刚开始时候幕布不是16：9，会导致小球跑出画面外
2. 增加“联机对战”模式
为了区分：用户自己，机器人，联机玩家。需要把 is_me 改成字符串，用以表示不同 Player<br>
`menu/zbase.js`<br>
`playground/zbase.js`<br>
`playground/player/zbase.js`<br>
2023/5/12 over
3. 配置django_channels
django_channels 就是基于 wss 协议的一种实现<br>
wss 是 web-socker 协议的安全模式，支持 C/S 下的双向通信（HTTP协议只支持单向通信）
* 安装 channels_redis
配置 `acapp/asgi.py`<br>
配置 `acapp/settings.py`<br>
配置 `game/routing.py`(这一部分的作用相当于 http 的 urls)<br>
编写 `game/consumers`(这一部分的作用相当于 http 的 views)<br>
启动 `django_channels`
* 建立 WSS 连接
路由 routing `game/routing.py`<br>
前端js `playground/zbase.js`; `playground/socket/multiplayer/zbase.js`<br>
2023/5/13 over
4. 编写同步函数

