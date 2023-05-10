from django.http import JsonResponse
from urllib.parse import quote
from random import randint
from django.core.cache import cache

def get_state():    # 随机8位数字
    res = ""
    for i in range(8):
        res += str(randint(0, 9))
    return res


# 申请授权码code
def apply_code(request):
    # 传递的四个参数
    appid = "5427"
    # quote就是换特殊字符
    redirect_uri = quote("https://app5427.acapp.acwing.com.cn/settings/acwing/web/receive_code/")
    scope = "userinfo"
    # 给一个随机值，防止被攻击
    state = get_state()

    cache.set(state, True, 7200)    # 把随机的状态码存入 redis 中，有效期 2 小时

    apply_code_url = "https://www.acwing.com/third_party/api/oauth2/web/authorize/"

    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url + "?appid=%s&redirect_uri=%s&scope=%s&state=%s" % (appid, redirect_uri, scope, state)
    })