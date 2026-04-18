import re

with open('src/app/packages/checkout/page.tsx', 'r') as f:
    content = f.read()

# Notice that in auth-context.tsx, it's user.walletBalance NOT user.wallet_balance.
search1 = "if ((user.wallet_balance || 0) < draft.package_price) {"
replace1 = "if ((user.walletBalance || user.wallet_balance || 0) < draft.package_price) {"

search2 = "<p className=\"text-xs text-gray-500\">Balance: ₹{user?.wallet_balance || 0}</p>"
replace2 = "<p className=\"text-xs text-gray-500\">Balance: ₹{user?.walletBalance || user?.wallet_balance || 0}</p>"

content = content.replace(search1, replace1)
content = content.replace(search2, replace2)

with open('src/app/packages/checkout/page.tsx', 'w') as f:
    f.write(content)
print("Fixed wallet property check in checkout")
