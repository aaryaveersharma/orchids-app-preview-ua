import re

with open('src/app/packages/checkout/page.tsx', 'r') as f:
    content = f.read()

# Make sure to update the user reference to refresh if needed.
# Auth context might cache an old wallet balance, let's refresh it.

search = """  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    const stored = localStorage.getItem('ua_package_draft');
    if (!stored) {
      router.replace('/packages');
      return;
    }
    setDraft(JSON.parse(stored));
  }, [user, isLoading, router]);"""

replace = """  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    const stored = localStorage.getItem('ua_package_draft');
    if (!stored) {
      router.replace('/packages');
      return;
    }
    setDraft(JSON.parse(stored));

    // Refresh user context to get the latest wallet balance
    if (user && refreshUser) {
        refreshUser();
    }
  }, [user, isLoading, router]);"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/packages/checkout/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed wallet balance in checkout")
else:
    print("Could not find insertion point")
