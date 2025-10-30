import re

with open('src/pages/Statement.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove as linhas 807 a 811 (as linhas de duplicação)
result = []
skip_lines = {807-1, 808-1, 809-1, 810-1, 811-1}  # 0-indexed

for i, line in enumerate(lines):
    if i not in skip_lines:
        result.append(line)

with open('src/pages/Statement.tsx', 'w', encoding='utf-8') as f:
    f.writelines(result)

print("Fixed!")
