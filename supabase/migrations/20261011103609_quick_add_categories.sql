-- Personal categories and merchant rules. Composite keys prevent references
-- to another owner's categories even when a guessed UUID is submitted.
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100 AND name=btrim(name)),
  bucket text NOT NULL CHECK (bucket IN ('fixed','flex','non_monthly','income','transfer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,name), UNIQUE(id,user_id)
);
CREATE TABLE public.category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_text text NOT NULL CHECK (length(match_text) BETWEEN 2 AND 100 AND match_text=lower(btrim(match_text))),
  category_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,match_text),
  FOREIGN KEY(category_id,user_id) REFERENCES public.categories(id,user_id) ON DELETE CASCADE
);
CREATE INDEX category_rules_category_owner_idx ON public.category_rules(category_id,user_id);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_access ON public.categories FOR ALL TO authenticated
  USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY owner_access ON public.category_rules FOR ALL TO authenticated
  USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
REVOKE ALL ON public.categories,public.category_rules FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.categories,public.category_rules TO authenticated;
GRANT ALL ON public.categories,public.category_rules TO service_role;
ALTER TABLE public.transactions
  ADD COLUMN source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','recurring','import','ai')),
  ADD COLUMN category_id uuid,
  ADD CONSTRAINT transaction_category_owner FOREIGN KEY(category_id,user_id) REFERENCES public.categories(id,user_id);
CREATE INDEX transactions_category_owner_idx ON public.transactions(category_id,user_id);
-- Preserve existing spelling and ledger values; categories are additive.
INSERT INTO public.categories(user_id,name,bucket)
SELECT DISTINCT user_id,btrim(category),CASE WHEN category='Transfer' THEN 'transfer' WHEN type='income' THEN 'income' ELSE 'flex' END
FROM public.transactions WHERE length(btrim(category)) BETWEEN 1 AND 100
ON CONFLICT(user_id,name) DO NOTHING;
-- Don't update existing ledger rows here: updates invoke ownership/balance
-- triggers. Old free-text categories remain readable without rewriting history.
