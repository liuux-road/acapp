from django.http import JsonResponse
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from game.models.player.player import Player
# from django.contrib.auth import login
from random import randint

def receive_code(request):
    
    # 申请授权令牌 access_token 和用户的 openid
    data = request.GET
    # 这里和web不一样，web端拒绝后直接就返回页面，这里会收到错误码
    if "errcode" in data:
        return JsonResponse({
            'result': "apply failed",
            'errcode': data['errcode'],
            'errmsg': data['errmsg'],
        })
    code = data.get('code')
    state = data.get('state')

    # 如果state不存在，返回state不存在
    if not cache.has_key(state):
        return JsonResponse({
            'result': "state not exist",
        })
    cache.delete(state)

    apply_access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params = {
        'appid': "5427",
        'secret': "9be89504078c4e55981d79c5e399c200",
        'code': code
    }
    
    access_token_res = requests.get(apply_access_token_url, params=params).json()
    # print(access_token_res)

    # 申请用户信息
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    # 如果acw账户对应用户已经存在，直接登录
    players = Player.objects.filter(openid=openid)
    if players.exists():   
        # acapp端不需要重新登陆 
        # login(request, players[0].user)
        # return redirect("index")
        player = players[0]
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })


    # 如果acw账户对应用户不存在，申请授权，用户信息
    get_userinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params = {
        "access_token": access_token,
        "openid": openid
    }
    userinfo_res = requests.get(get_userinfo_url, params=params).json()

    # 拿到用户名和头像
    username = userinfo_res['username']
    photo = userinfo_res['photo']

    # 如果重名，额外添加数字填充
    while User.objects.filter(username=username).exists():  
        username += str(randint(0, 9))

    # 注册新用户
    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)

    # 不需要登录
    # login(request, user)

    # return redirect("index")
    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo,
    })