import re

with open('src/app/packages/page.tsx', 'r') as f:
    content = f.read()

search = """        <button onClick={() => router.push('/profile')} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
            Active Packages
        </button>"""

replace = """        <button onClick={() => router.push('/packages/active')} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
            Active Packages
        </button>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/packages/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed packages link")
else:
    print("Could not find insertion point")
