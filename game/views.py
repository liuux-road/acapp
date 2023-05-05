from django.http import HttpResponse

def index(request):
    return HttpResponse("game/view.py 下写的一个index函数收到request后得到的一个反馈")
# index函数得到一个路由，返回一个字符串

