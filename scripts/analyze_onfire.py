import urllib.request
import re

req = urllib.request.Request(
    'https://onfire.fashion/',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

matches = [m.start() for m in re.finditer(r'/products/', html)]
if len(matches) > 1:
    pos = matches[1]
    print(html[pos-100:pos+1200])
