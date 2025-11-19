# 🔧 FINAL FIXES: Resolve Minor Issues

## 🎯 GOAL
Fix two minor issues from the verification report:
1. Create `billing_subscriptions` table in Supabase
2. Verify language switcher works correctly

---

## ⚡ STEP 1: Create billing_subscriptions Table

### Check: Does the table exist?

1. Open: https://supabase.com/dashboard
2. Find your project (URL should match `NEXT_PUBLIC_SUPABASE_URL` from Vercel)
3. Open: Table Editor
4. Check if `billing_subscriptions` table exists

**If table DOES NOT exist:**

### Solution: Run migration

1. Open: Supabase Dashboard → SQL Editor
2. Copy and execute this SQL code:

```sql
-- Create billing_subscriptions table
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'plus', 'pro')),
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  yookassa_payment_id TEXT,
  crypto_payment_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_user_id_idx
ON public.billing_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.billing_subscriptions;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.billing_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.billing_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_billing_subscription_updated_at ON public.billing_subscriptions;
CREATE TRIGGER set_billing_subscription_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

3. Click "Run" (or F5)
4. Check result:
   - ✅ Should see "Success. No rows returned"
   - ✅ Or "Success" with number of affected rows

### Verification after creation:

1. Open: Table Editor
2. Check:
   - ✅ `billing_subscriptions` table appeared?
   - ✅ Has columns: `id`, `user_id`, `plan`, `status`, `created_at`, `updated_at`?

**If table ALREADY EXISTS:**

Check structure:
1. Open `billing_subscriptions` table
2. Check columns:
   - ✅ `id` (UUID, PRIMARY KEY)
   - ✅ `user_id` (UUID, references profiles)
   - ✅ `plan` (TEXT, values: 'basic', 'plus', 'pro')
   - ✅ `status` (TEXT, default 'inactive')
   - ✅ `created_at` (TIMESTAMPTZ)
   - ✅ `updated_at` (TIMESTAMPTZ)

If structure differs — execute SQL above (it's safe, uses `IF NOT EXISTS`).

---

## ⚡ STEP 2: Verify Language Switcher

### Current implementation:

Language switcher uses:
- `LocaleContext` (React Context)
- `localStorage` to save choice
- Browser language auto-detection

**This is correct implementation!** But can be improved for SEO.

### Verification:

1. Open: https://chatedem.com
2. Check:
   - ✅ Is there a language switch button (RU/EN)?
   - ✅ Does language change when clicked?
   - ✅ Is choice saved after page reload?

**If switcher DOES NOT work:**

### Solution: Check code

1. Check file: `src/components/LanguageSwitcher.tsx`
   - Should import: `import { useLocale } from '@/contexts/LocaleContext';`
   - Should call: `const { locale, setLocale } = useLocale();`

2. Check file: `src/app/layout.tsx`
   - Should wrap children in `<LocaleProvider>`

3. Check file: `src/contexts/LocaleContext.tsx`
   - Should save to `localStorage`
   - Should detect browser language

**If everything is correct but doesn't work:**

Maybe component is not displayed. Check:
- Where is `<LanguageSwitcher />` used?
- Is it on the main page?

---

## ⚡ STEP 3: Improve Language Switcher (Optional)

### Add URL parameter support for SEO:

You can add support for `/en` and `/ru` in URL, but it's not critical.

**Current implementation (via localStorage) — correct and sufficient!**

If you want to add URL parameters:

1. Update `src/contexts/LocaleContext.tsx`:
   - Read `locale` from URL (if `/en` or `/ru` exists)
   - Save to `localStorage`
   - Update URL when switching

2. Update `src/middleware.ts`:
   - Redirect `/en` and `/ru` to main page with correct locale

**But this is not required!** Current implementation works correctly.

---

## ✅ VERIFICATION CHECKLIST

After completing all steps:

- [ ] `billing_subscriptions` table created in Supabase
- [ ] Table has all required columns
- [ ] RLS policies configured for table
- [ ] Language switcher displayed on website
- [ ] Language switching works
- [ ] Language choice saved after reload
- [ ] Browser language auto-detection works

---

## 🎯 FINAL REPORT

After completion, create report:

```markdown
# Final Fixes Report

**Date:** [date and time]
**Agent:** AI Agent

## Completed steps:
- [x] STEP 1: Create billing_subscriptions table
- [x] STEP 2: Verify language switcher
- [x] STEP 3: Improve switcher (if needed)

## Results:

### billing_subscriptions table:
- ✅ Created: [yes/no]
- ✅ Structure correct: [yes/no]
- ✅ RLS policies configured: [yes/no]

### Language switcher:
- ✅ Displayed on website: [yes/no]
- ✅ Switching works: [yes/no]
- ✅ Choice saved: [yes/no]

## Status:
- ✅ All issues resolved
- ✅ System fully ready
```

---

## 🚀 START WITH STEP 1!

Execute steps in order. After completing all steps, the system will be fully ready.

