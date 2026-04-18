import re

with open('src/app/profile/page.tsx', 'r') as f:
    content = f.read()

# Make sure to remove any remaining package fetch code
fetch_search2 = """      const fetchPackages = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setPackages(data.packages);
        }
      };
      fetchPackages();"""

content = content.replace(fetch_search2, "")

with open('src/app/profile/page.tsx', 'w') as f:
    f.write(content)
