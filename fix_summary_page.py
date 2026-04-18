import re

with open('src/app/booking/summary/page.tsx', 'r') as f:
    content = f.read()

# Replace appliedPackage with summaryData.package_id
search = "packageId: appliedPackage?.id || null,"
replace = "packageId: summaryData.package_id || null,"

content = content.replace(search, replace)

with open('src/app/booking/summary/page.tsx', 'w') as f:
    f.write(content)
