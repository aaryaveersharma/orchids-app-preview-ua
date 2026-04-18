import re

with open('src/app/profile/page.tsx', 'r') as f:
    content = f.read()

# Let's remove the second effect manually
search = """  useEffect(() => {
    const fetchPackages = async () => {
      if (!user) return;
      setLoadingPackages(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch (err) {
        console.error("Failed to fetch packages", err);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [user]);"""

content = content.replace(search, "")

state_search = """  const [loadingPackages, setLoadingPackages] = useState(false);"""
content = content.replace(state_search, "")

with open('src/app/profile/page.tsx', 'w') as f:
    f.write(content)
