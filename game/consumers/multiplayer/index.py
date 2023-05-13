# 这一部分的作用相当于 http 的 views
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class MultiPlayer(AsyncWebsocketConsumer):

    # 建立连接
    async def connect(self):
        await self.accept()
        print('accept')

        # 组的概念，为了群发
        self.room_name = "room"
        await self.channel_layer.group_add(self.room_name, self.channel_name)

    # 结束链接（不靠谱i）
    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name);

    # 客户请求
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(data)
