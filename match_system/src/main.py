#! /usr/bin/env python3

import glob
import sys
sys.path.insert(0, glob.glob('../../')[0])

from match_server.match_service import Match

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

from queue import Queue
from time import sleep
from threading import Thread

from acapp.asgi import channel_layer
from asgiref.sync import async_to_sync  # 多线程变成单线程的API
from django.core.cache import cache

queue = Queue()  # 初始化消息队列

class Player:  # 定义Player类
    def __init__(self, score, uuid, username, photo, channel_name):
        self.score = score
        self.uuid = uuid
        self.username = username
        self.photo = photo
        self.channel_name = channel_name
        self.waiting_time = 0  # 等待时间


class Pool:  # 匹配池功能
    def __init__(self):
        self.players = []  # 当前匹配池中的玩家

    def add_player(self, player):  # 添加一名玩家
        self.players.append(player)

    def check_match(self, a, b):  # 检验两个人的分数是否匹配
        dt = abs(a.score - b.score)
        a_max_dif = a.waiting_time * 50
        b_max_dif = b.waiting_time * 50
        return dt <= a_max_dif and dt <= b_max_dif

    def match_success(self, ps):  # 匹配成功
        print("Match Success: %s %s %s" % (ps[0].username, ps[1].username, ps[2].username))
        room_name = "room-%s-%s-%s" % (ps[0].uuid, ps[1].uuid, ps[2].uuid)
        players = []
        for p in ps:
            async_to_sync(channel_layer.group_add)(room_name, p.channel_name)
            players.append({
                'uuid': p.uuid,
                'username': p.username,
                'photo': p.photo,
                'hp': 100,
            })
        cache.set(room_name, players, 3600)  # 有效时间：1小时
        for p in ps:  # 广播这名玩家被创建出来的信息
            async_to_sync(channel_layer.group_send)(
                room_name,
                {
                    'type': "group_send_event",
                    'event': "create_player",
                    'uuid': p.uuid,
                    'username': p.username,
                    'photo': p.photo,
                }
            )

    def increase_waiting_time(self):  # 匹配等待
        for player in self.players:
            player.waiting_time += 1

    def match(self):  # 匹配
        while len(self.players) >= 3:
            self.players = sorted(self.players, key=lambda p: p.score)  # 先排序
            flag = False
            for i in range(len(self.players) - 2):  # 从起点开始枚举
                a, b, c = self.players[i], self.players[i + 1], self.players[i + 2]
                if self.check_match(a, b) and self.check_match(a, c) and self.check_match(b, c):  # 三名玩家都满足要求
                    self.match_success([a, b, c])
                    self.players = self.players[:i] + self.players[i + 3:]  # 删除匹配成功的
                    flag = True  # 表示成功
                    break
            if not flag:  # 没有成功
                break

        self.increase_waiting_time()



class MatchHandler:
    def add_player(self, score, uuid, username, photo, channel_name):  # 增加player
        print("Add Player: %s %d" % (username, score))
        player = Player(score, uuid, username, photo, channel_name)  # 创建Player
        queue.put(player)  # 新的Player加进消息队列
        return 0


def get_player_from_queue():  # 从队列中取元素（如果有元素返回元素，如果没有返回空）
    try:
        return queue.get_nowait()
    except:
        return None


def worker():  # 消费者
    pool = Pool()  # 匹配池，死循环
    while True:
        player = get_player_from_queue() 
        if player:
            pool.add_player(player)  # 如果有新元素，就加元素
        else:
            pool.match()  # 如果没新元素，就匹配
            sleep(1)  # 每次匹配完成休息1s





if __name__ == '__main__':
    handler = MatchHandler()
    processor = Match.Processor(handler)
    transport = TSocket.TServerSocket(host='127.0.0.1', port=9090)
    tfactory = TTransport.TBufferedTransportFactory()
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()

    server = TServer.TThreadedServer(
        processor, transport, tfactory, pfactory)

    Thread(target=worker, daemon=True).start()  # 定义新的线程

    print('Starting the server...')
    server.serve()
    print('done.')