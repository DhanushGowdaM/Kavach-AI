import json
import urllib.request

data = json.dumps({
    'email': 'admin@bharatiyabank.example.com',
    'password': 'Kavach@2024'
}).encode('utf-8')
req = urllib.request.Request(
    'http://localhost:8000/api/auth/login',
    data=data,
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req, timeout=10) as res:
        print('STATUS', res.status)
        print(res.read().decode('utf-8'))
except Exception as e:
    print(type(e).__name__, e)
    if hasattr(e, 'read'):
        try:
            print(e.read().decode('utf-8'))
        except Exception:
            pass
