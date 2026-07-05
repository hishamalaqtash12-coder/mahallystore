import re

with open('src/app/[locale]/vendors/[slug]/page.js', 'r', encoding='utf-8') as f:
    text = f.read()

arabic_pattern = re.compile(r'[\u0600-\u06FF]+')
matches = arabic_pattern.findall(text)

with open('scratch/arabic_left.txt', 'w', encoding='utf-8') as out:
    if matches:
        for match in set(matches):
            out.write(match + '\n')
    else:
        out.write('No Arabic text found.')
