import re

with open('src/app/packages/checkout/page.tsx', 'r') as f:
    content = f.read()

search = """  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/packages/checkout');
      return;
    }
    const d = localStorage.getItem('ua_booking_draft');
    if (!d) {
      router.replace('/packages');
      return;
    }
    const parsed = JSON.parse(d);
    if (parsed.type !== 'package') {
       router.replace('/packages');
       return;
    }
    setDraft(parsed);
  }, [user, isLoading, router]);"""

replace = """  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/packages/checkout');
      return;
    }
    const d = localStorage.getItem('ua_booking_draft');
    if (!d) {
      router.replace('/packages');
      return;
    }
    const parsed = JSON.parse(d);
    if (parsed.type !== 'package') {
       router.replace('/packages');
       return;
    }
    setDraft(parsed);
  }, [user, isLoading, router]);

  useEffect(() => {
      // Refresh user context to ensure we have the absolute latest wallet balance
      // from the database, not a stale cached version.
      if (user && refreshUser) {
          refreshUser();
      }
  }, []);"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/packages/checkout/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed wallet balance in checkout")
else:
    print("Could not find insertion point")
