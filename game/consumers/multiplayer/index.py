# 这一部分的作用相当于 http 的 views
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from match_system.src.match_server.match_service import Match
from game.models.player.player import Player
from channels.db import database_sync_to_async  # c串行操作变并行

class MultiPlayer(AsyncWebsocketConsumer):
    # 主函数
    async def connect(self):  ### 建立连接
        await self.accept()  # 接受请求
    async def disconnect(self, close_code):  ### 结束链接（不靠谱i）
        print('disconnect')
        if self.room_name :
            await self.channel_layer.group_discard(self.room_name, self.channel_name);
    async def receive(self, text_data):  ### 客户请求
        data = json.loads(text_data)
        event = data['event']  # 判断什么事件，做一个路由
        if event == "create_player":
            await self.create_player(data)  # 创建角色事件
        elif event == "move_to":
            await self.move_to(data)  # 角色移动
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)
        elif event == "message":
            await self.message(data)
    # 路由函数
    async def create_player(self, data):  # 创建角色事件
        self.room_name = None
        self.uuid = data['uuid']
        # Make socket
        transport = TSocket.TSocket('127.0.0.1', 9090)
        # Buffering is critical. Raw sockets are very slow
        transport = TTransport.TBufferedTransport(transport)
        # Wrap in a protocol
        protocol = TBinaryProtocol.TBinaryProtocol(transport)
        # Create a client to use the protocol encoder
        client = Match.Client(protocol)
        def db_get_player():
            return Player.objects.get(user__username=data['username'])
        player = await database_sync_to_async(db_get_player)()
        # Connect!
        transport.open()
        client.add_player(player.score, data['uuid'], data['username'], data['photo'], self.channel_name)
        # Close!
        transport.close()
        # self.room_name = None
        # for i in range(1000):   # 枚举下用哪一个房间（上限 1k 个房间）
        #     name = "room-%d" % (i)
        #     if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:  # 当前房间为空，或房间内玩家人数不到 ROOM_CAPACITY-》加入
        #         self.room_name = name
        #         break
        # if not self.room_name:  # 没有空房间了-》退出
        #     return
        
        # if not cache.has_key(self.room_name):  # 如果房间不存在，则新建房间
        #     cache.set(self.room_name, [], 3600)  # 有效期 1 小时
        # for player in cache.get(self.room_name):  # 把房间中的旧用户，发送给新进来的用户
        #     await self.send(text_data=json.dumps({
        #         'event': "create_player",
        #         'uuid': player['uuid'],
        #         'username': player['username'],
        #         'photo': player['photo'],
        #     }))
        # await self.channel_layer.group_add(self.room_name, self.channel_name)  # 房间中加入这个新人

        # players = cache.get(self.room_name)  # 找到房间归属
        # players.append({  # 加入房间
        #     'uuid': data['uuid'],
        #     'username': data['username'],
        #     'photo': data['photo'],
        # })
        # cache.set(self.room_name, players, 3600) # 更新房间存在时间为 1 小时（最后一次加入一名玩家时）
        # await self.channel_layer.group_send(  # 群发消息更新
        #     self.room_name,
        #     {
        #         'type': "group_send_event",  # type这个关键字比较重要。群发该消息后，作为客户端接受者，所接受用的函数名
        #         'event': "create_player",
        #         'uuid': data['uuid'],
        #         'username': data['username'],
        #         'photo': data['photo'],
        #     }
        # )
    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "move_to",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "shoot_fireball",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'ball_uuid': data['ball_uuid'],
            }
        )
    async def attack(self, data):
        #  战绩更新
        if not self.room_name:
            return
        players = cache.get(self.room_name)

        if not players:
            return
        for player in players:
            if player['uuid'] == data['attackee_uuid']:
                player['hp'] -= 25
        remain_cnt = 0
        for player in players:
            if player['hp'] > 0:
                remain_cnt += 1
        if remain_cnt > 1:  # 继续进行游戏
            if self.room_name:
                cache.set(self.room_name, players, 3600)
        else:   # 结算 
            def db_update_player_score(username, score):
                player = Player.objects.get(user__username=username)
                player.score += score
                player.save()
            for player in players:
                if player['hp'] <= 0:
                    await database_sync_to_async(db_update_player_score)(player['username'], -5)
                else:
                    await database_sync_to_async(db_update_player_score)(player['username'], 10)
        #####
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "attack",
                'uuid': data['uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],
            }
        )
    async def blink(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "blink",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    async def message(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "message",
                'uuid': data['uuid'],
                'username': data['username'],
                'text': data['text'],
            }
        )
    # 群发事件函数（路由函数中指定）
    async def group_send_event(self, data):
        if not self.room_name:
            keys = cache.keys('*%s*' % (self.uuid))
            if keys:
                self.room_name = keys[0]
        await self.send(text_data=json.dumps(data))
        
