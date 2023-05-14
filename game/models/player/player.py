from django.db import models
from django.contrib.auth.models import User

class Player(models.Model): # Player 类继承自 Model 类
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # 说明Player是从User表扩充过来的，每一个player都与一个user是一一对应关联关系
    # 后一个参数是指，当user被删除后，对应的player也要被删除
    # （感觉就是外键的意思）
    photo = models.URLField(max_length=256, blank=True)
    # 用于存储用户的头像的url

    # 为了实现一键登录，需要额外存储一个 openid 来标识每一个 Player 绑定的 AcWing 账号
    openid = models.CharField(default="", max_length=256, blank=True, null=True)
    score = models.IntegerField(default=1500)


    # 指定每个player数据展示在前台的数据
    def __str__(self):
        return str(self.user)    # 展示用户的用户名
