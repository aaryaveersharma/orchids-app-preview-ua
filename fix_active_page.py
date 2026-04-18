import re

with open('src/app/packages/active/page.tsx', 'r') as f:
    content = f.read()

search1 = "{pkg.packages?.name || 'Service Package'}"
replace1 = "{pkg.package_name || pkg.packages?.name || 'Service Package'}"

search2 = "pkg.purchased_at"
replace2 = "pkg.created_at || pkg.purchased_at"

search3 = "pkg.service_allowances"
replace3 = "pkg.remaining_allowances || pkg.service_allowances"

content = content.replace(search1, replace1)
content = content.replace(search2, replace2)
content = content.replace(search3, replace3)

with open('src/app/packages/active/page.tsx', 'w') as f:
    f.write(content)
