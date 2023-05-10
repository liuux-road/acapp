from django.http import JsonResponse
from game.models.player.player import Player

def getinfo_acapp(request):
    player = Player.objects.all()[0]    # 取出数据库中第一个用户(调试该功能)
    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo,
    })

def getinfo_web(request):
    user = request.user
    if not user.is_authenticated:   # 未登录
        return JsonResponse({
            'result': "not login"
        })
    else:                           # 已登录
        player = Player.objects.all()[0]
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })

def getinfo(request):   # 处理请求
    platform = request.GET.get('platform')  # 根据请求的平台不同，进行不同返回处理
    if platform == "ACAPP":
        return getinfo_acapp(request)
    elif platform == "WEB":
        return getinfo_web(request)
