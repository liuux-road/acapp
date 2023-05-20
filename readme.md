# 一个伟大的史诗级巨著！！！
> 目前可登录的网站：https://app5427.acapp.acwing.com.cn/game
> 自己的网站还在ICP备案审核。。。

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
1. 统一长度单位<br>
地图 16:9 等比例缩放`js/src/playground/zbase.js`;`js/src/playground/game_map/zbase.js`;`css/game.css`;`js/src/playground/game_map/zbase.js`<br>
玩家 Player 缩放渲染`js/src/playground/zbase.js`;`js/src/playground/player/zbase.js`;<br>
火球 Fireball 缩放渲染`js/src/playground/skill/fireball/zbase.js`<br>
粒子 particle 缩放渲染`js/src/playground/particle/zbase.js`<br>
2023/5/12 over<br>
问题：可能是浏览器刷新不彻底，导致缩放的小球一直不显示出来；另外有一个bug就是刚开始时候幕布不是16：9，会导致小球跑出画面外
2. 增加“联机对战”模式<br>
为了区分：用户自己，机器人，联机玩家。需要把 is_me 改成字符串，用以表示不同 Player<br>
`menu/zbase.js`<br>
`playground/zbase.js`<br>
`playground/player/zbase.js`<br>
2023/5/12 over
3. 配置django_channels<br>
django_channels 就是基于 wss 协议的一种实现<br>
wss 是 web-socker 协议的安全模式，支持 C/S 下的双向通信（HTTP协议只支持单向通信）
* 安装 channels_redis<br>
配置 `acapp/asgi.py`<br>
配置 `acapp/settings.py`<br>
配置 `game/routing.py`(这一部分的作用相当于 http 的 urls)<br>
编写 `game/consumers`(这一部分的作用相当于 http 的 views)<br>
启动 `django_channels`
* 建立 WSS 连接<br>
路由 routing `game/routing.py`<br>
前端js `playground/zbase.js`; `playground/socket/multiplayer/zbase.js`<br>
2023/5/13 over
4. 编写同步函数<br>
一共需要完成四个通信：<br>
（通信的逻辑基本都是现在本地完成，然后将结果返回给服务器，服务器再分发给其他客户端，达成同步）<br>
`create-player` : 在所有玩家的游戏界面，创建一个新加入的玩家<br>
`move-to` : 在所有玩家的游戏界面，讲一个角色移动到一个位置<br>
`shoot-fireball` : 在所有玩家的游戏界面，让一个角色发射一个火球<br>
`attack` : 在所有玩家的游戏界面，让一个角色被攻击<br>
一场游戏里，所有的元素（玩家，火球等）都需要唯一的标识，来方便同步<br>

为此，我们可以直接修改一下游戏引擎，对于每个元素都创建我们需要的唯一标识
* create-player<br>
后端 `settings.py`; `consumers/multiplayer/index.py`<br>
前端 `playground/socket/multiplayer/zbase.js`<br>
2023/5/13 over
* move-to<br>
为了让游戏界面中对于要移动的元素做出移动动作，需要对 move_to 函数做出一些修改<br>
首先要标识出当前为多人模式，然后模式为多人模式时，每次移动都会触发一次通信
* shoot-fireball<br>
优化一下火球元素<br>
用一个数组来存一个玩家发射的所有火球，以便于子弹消失时，将他们找出并对应删掉
* attack
> 为了只让一个客户端进行攻击命中的判断，因此只有发出方的火球才做碰撞检测
> 其他客户端对于该火球只有动画效果
> 又由于碰撞检测是在一台客户端上进行的，因此多端之间可能会存在同步上的延迟
> 为此的解决方法是：碰撞检测成功时，强制把被击中玩家移动到发起方客户端中的位置，以避免击中延迟上发生的事情<br>
2023/5/13 over
* 游戏的小优化
先不看了<br>
7.2视频1：09：22开始
* 火球冷却
* 添加闪现技能<br>
2023/5/13 over
### 8. 实现聊天系统
* 优化键盘绑定事件
* chat field 负责管理 文本输入框 和 历史记录显示框
* 联机聊天窗<br>
2023/5/13 over
### 9. 实现匹配系统
##### 9.1 thrift匹配系统
thrift 接口文件<br>
服务端<br>
客户端<br>
2023/5/14 over
##### 9.2 项目收尾<br>
1. 加密、压缩js代码
2. 清理监听函数
3. 编写每局游戏的结束界面
4. 更新战绩
5. 添加favicon.ico
2023/5/14 over
### 10. 实现匹配系统
先不看了，目前就这样吧，初步搞定
2023/5/14 over
