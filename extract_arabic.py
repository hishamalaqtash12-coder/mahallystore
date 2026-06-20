import json
import re
import os

with open('c:/Users/ASUS/Desktop/FE/src/components/Hero.js', 'r', encoding='utf-8') as f:
    text = f.read()

arabic_chars = re.compile('[\u0600-\u06FF]+')
strings = []
for line in text.split('\n'):
    if arabic_chars.search(line):
        strings.append(line.strip())

with open('c:/Users/ASUS/Desktop/FE/hero_arabic.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(set(strings)))
