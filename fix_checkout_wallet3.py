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
    if (d) {
      setDraft(JSON.parse(d));
    } else {
      router.replace('/packages');
    }
  }, [isLoading, user, router]);"""

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
    if (d) {
      setDraft(JSON.parse(d));
    } else {
      router.replace('/packages');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
     // Fetch the latest user profile details (including wallet_balance)
     // so we don't display a stale cached value of 0.
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
