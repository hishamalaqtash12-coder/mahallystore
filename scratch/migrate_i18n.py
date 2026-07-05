import os
import re

def update_routing_imports(content):
    # 1. Replace Link import
    content = re.sub(
        r'import\s+Link\s+from\s+["\']next/link["\'];?',
        'import { Link } from "@/i18n/routing";',
        content
    )
    
    # 2. Handle next/navigation imports
    # Find something like: import { useRouter, usePathname } from "next/navigation";
    def replace_nav(match):
        imports_str = match.group(1)
        imports = [i.strip() for i in imports_str.split(',')]
        
        i18n_imports = []
        next_imports = []
        
        for i in imports:
            if not i: continue
            if i in ['useRouter', 'usePathname', 'redirect']:
                i18n_imports.append(i)
            else:
                next_imports.append(i)
                
        replacement = ""
        if next_imports:
            replacement += f'import {{ {", ".join(next_imports)} }} from "next/navigation";\n'
        if i18n_imports:
            replacement += f'import {{ {", ".join(i18n_imports)} }} from "@/i18n/routing";\n'
            
        return replacement.strip()

    content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+["\']next/navigation["\'];?', replace_nav, content)
    
    return content

def update_css_classes(content):
    # Whole word replacements
    content = re.sub(r'\btext-right\b', 'text-start', content)
    content = re.sub(r'\btext-left\b', 'text-end', content)
    content = re.sub(r'\bfloat-right\b', 'float-start', content)
    content = re.sub(r'\bfloat-left\b', 'float-end', content)

    # Prefix replacements
    def repl(m):
        prefix = m.group(1)
        val = m.group(2)
        mapping = {
            'pl': 'pe', 'pr': 'ps',
            'ml': 'me', 'mr': 'ms',
            'left': 'end', 'right': 'start',
            'border-l': 'border-e', 'border-r': 'border-s',
            'rounded-l': 'rounded-e', 'rounded-r': 'rounded-s'
        }
        return mapping[prefix] + '-' + val

    content = re.sub(
        r'\b(pl|pr|ml|mr|left|right|border-l|border-r|rounded-l|rounded-r)-([0-9a-zA-Z\.\[\]/]+)',
        repl,
        content
    )
    
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()
        
    content = update_routing_imports(original_content)
    content = update_css_classes(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def main():
    root_dir = 'c:\\Users\\ASUS\\Desktop\\FE\\src'
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
