import re

with open('src/app/[locale]/vendors/[slug]/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

arabic_pattern = re.compile(r'[\u0600-\u06FF]+')
found = False

with open('scratch/arabic_lines.txt', 'w', encoding='utf-8') as out:
    for i, line in enumerate(lines):
        if arabic_pattern.search(line):
            out.write(f"Line {i+1}: {line.strip()}\n")
            found = True

    if not found:
        out.write("No Arabic text found.")
