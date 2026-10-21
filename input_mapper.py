"""Ponte local para o Windows. Apenas toques curtos, sem teclas presas."""
import ctypes,json,time,urllib.request,pathlib,sys
user32=ctypes.windll.user32
VK={'LEFT':0x25,'UP':0x26,'RIGHT':0x27,'DOWN':0x28,'SPACE':0x20,'ENTER':0x0D}
VK.update({c:ord(c) for c in 'WASDJKXZ'})
token=json.loads((pathlib.Path(__file__).parent/'runtime.json').read_text())['secret']
failures=0
while True:
    try:
        if user32.GetAsyncKeyState(0x77)&1:
            pause=urllib.request.Request('http://127.0.0.1:3001/api/control',data=b'{"armed":false}',headers={'X-Control-Token':token,'Content-Type':'application/json'},method='POST')
            urllib.request.urlopen(pause,timeout=1).close()
        request=urllib.request.Request('http://127.0.0.1:3001/api/input',headers={'X-Control-Token':token})
        with urllib.request.urlopen(request,timeout=1) as response:
            data=json.load(response)
        failures=0
        for item in data['keys']:
            if time.time()*1000>item['expires'] or item['key'] not in VK: continue
            vk=VK[item['key']]
            extended=1 if item['key'] in ('LEFT','RIGHT','UP','DOWN') else 0
            user32.keybd_event(vk,0,extended,0)
            try: time.sleep(.035)
            finally: user32.keybd_event(vk,0,extended|2,0)
        time.sleep(.015)
    except (OSError,ValueError,KeyError):
        failures+=1
        if failures>30: sys.exit(0)
        time.sleep(.4)
        try: token=json.loads((pathlib.Path(__file__).parent/'runtime.json').read_text())['secret']
        except (OSError,ValueError): pass
