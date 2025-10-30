with open('src/pages/Statement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remover as linhas duplicadas
content = content.replace(
    '''                  style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))' }}
                  name="📉 Saídas"
                  radius={[8, 8, 0, 0]}
                  style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(3, 18, 38, 0.3))' }}
                />''',
    '''                  style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))' }}
                />'''
)

with open('src/pages/Statement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
