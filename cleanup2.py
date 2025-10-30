with open('src/pages/Statement.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remover linhas específicas
new_lines = []
for i, line in enumerate(lines):
    # Skip linhas 806-807 (0-indexed: 805-806)
    if i not in [805, 806, 807]:
        new_lines.append(line)

with open('src/pages/Statement.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Removed 3 lines")
