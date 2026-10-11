-- Financial records are owned by Auth users; balances change inside the same
-- database transaction as their ledger entries. Existing balances are preserved.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_profile jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS transfer_id uuid;
ALTER TABLE public.emis ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE public.recurring_payments ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
-- Only unambiguous legacy names are mapped. Do not invent account associations.
UPDATE public.transactions t SET account_id=a.id,currency=a.currency
FROM public.accounts a WHERE t.user_id=a.user_id AND t.account=a.name
AND (SELECT count(*) FROM public.accounts x WHERE x.user_id=t.user_id AND x.name=t.account)=1;
ALTER TABLE public.invoices ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.emis DROP CONSTRAINT IF EXISTS emis_credited_account_id_fkey;
ALTER TABLE public.emis ADD CONSTRAINT emis_credited_account_id_fkey FOREIGN KEY(credited_account_id) REFERENCES public.accounts(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS invoice_number_per_user ON public.invoices(user_id,invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_one_payment ON public.transactions(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_transfer_id_idx ON public.transactions(transfer_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS emis_credited_account_id_idx ON public.emis(credited_account_id);

CREATE OR REPLACE FUNCTION private.create_user_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.profiles(id,email,name,preferences)
  VALUES(NEW.id,NEW.email,coalesce(nullif(NEW.raw_user_meta_data->>'name',''),split_part(NEW.email,'@',1)),
    '{"theme":"light","currency":"INR","notifications":true}'::jsonb)
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.create_user_profile() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS create_dime_profile ON auth.users;
CREATE TRIGGER create_dime_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.create_user_profile();
INSERT INTO public.profiles(id,email,name,preferences)
SELECT id,email,coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),
'{"theme":"light","currency":"INR","notifications":true}'::jsonb FROM auth.users WHERE email IS NOT NULL
ON CONFLICT(id) DO NOTHING;

-- Supabase RLS remains the boundary for every ordinary CRUD request.
DO $$ DECLARE t text; p record; BEGIN
  FOREACH t IN ARRAY ARRAY['accounts','transactions','clients','invoices','emis','credit_cards','recurring_payments'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY owner_access ON public.%I FOR ALL TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id)',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid())=id) WITH CHECK ((select auth.uid())=id);
GRANT SELECT,INSERT,UPDATE ON public.profiles TO authenticated;
REVOKE ALL ON public.profiles FROM anon;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.ledger_balance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.accounts; old_account uuid; new_account uuid;
BEGIN
  IF TG_OP<>'INSERT' THEN
    IF OLD.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF OLD.invoice_id IS NOT NULL OR OLD.transfer_id IS NOT NULL THEN RAISE EXCEPTION 'Linked payment/transfer history is immutable'; END IF;
    old_account:=OLD.account_id;
  END IF;
  IF TG_OP<>'DELETE' THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF NEW.amount<=0 OR NEW.amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Amount must be positive and finite'; END IF;
    IF NEW.account_id IS NULL THEN RAISE EXCEPTION 'Select an account'; END IF;
    IF (NEW.invoice_id IS NOT NULL OR NEW.transfer_id IS NOT NULL OR NEW.category='Transfer') AND coalesce(current_setting('dimex.compound',true),'')<>'yes' THEN RAISE EXCEPTION 'Use the payment or transfer operation'; END IF;
    new_account:=NEW.account_id;
  END IF;
  -- Lock both accounts in a stable order for account moves and concurrent edits.
  PERFORM id FROM public.accounts WHERE id IN (old_account,new_account) ORDER BY id FOR UPDATE;
  IF TG_OP<>'INSERT' AND OLD.status='completed' AND old_account IS NOT NULL THEN
    UPDATE public.accounts SET balance=balance-CASE WHEN OLD.type='income' THEN OLD.amount ELSE -OLD.amount END
    WHERE id=old_account AND user_id=auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Original account unavailable'; END IF;
  END IF;
  IF TG_OP<>'DELETE' THEN
    SELECT * INTO a FROM public.accounts WHERE id=new_account AND user_id=auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable'; END IF;
    NEW.account:=a.name; NEW.currency:=a.currency;
    IF NEW.status='completed' THEN
      UPDATE public.accounts SET balance=balance+CASE WHEN NEW.type='income' THEN NEW.amount ELSE -NEW.amount END WHERE id=new_account;
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION private.ledger_balance() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ledger_balance BEFORE INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION private.ledger_balance();

CREATE OR REPLACE FUNCTION private.validate_invoice() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE lines jsonb; meta jsonb; subtotal numeric:=0; discount numeric; tax numeric; item jsonb;
BEGIN
  IF TG_OP<>'INSERT' AND OLD.status='paid' THEN
    IF TG_OP='DELETE' OR NEW.amount<>OLD.amount OR NEW.items<>OLD.items OR NEW.status<>OLD.status OR NEW.invoice_number<>OLD.invoice_number OR NEW.date<>OLD.date OR NEW.due_date<>OLD.due_date THEN RAISE EXCEPTION 'Paid invoices are locked'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF NEW.client_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.clients WHERE id=NEW.client_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Client unavailable'; END IF;
  IF NEW.status='paid' AND NOT EXISTS(SELECT 1 FROM public.transactions WHERE invoice_id=NEW.id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Record payment first'; END IF;
  lines:=CASE WHEN jsonb_typeof(NEW.items)='array' THEN NEW.items ELSE NEW.items->'lineItems' END;
  meta:=CASE WHEN jsonb_typeof(NEW.items)='array' THEN '{}'::jsonb ELSE coalesce(NEW.items->'metadata','{}'::jsonb) END;
  IF jsonb_typeof(lines)<>'array' OR jsonb_array_length(lines)=0 THEN RAISE EXCEPTION 'Add invoice items'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(lines) LOOP
    IF (item->>'quantity')::numeric<=0 OR (item->>'rate')::numeric<0 THEN RAISE EXCEPTION 'Invalid quantity/rate'; END IF;
    subtotal:=subtotal+round((item->>'quantity')::numeric*(item->>'rate')::numeric,2);
  END LOOP;
  discount:=greatest(0,coalesce((meta->>'discountValue')::numeric,0));
  IF meta->>'discountType'='percentage' THEN discount:=subtotal*discount/100; END IF;
  discount:=round(least(subtotal,discount),2);
  tax:=round((subtotal-discount)*greatest(0,coalesce((meta->>'taxRate')::numeric,0))/100,2);
  NEW.amount:=subtotal-discount+tax;
  NEW.items:=jsonb_build_object('lineItems',lines,'metadata',meta||jsonb_build_object('subtotal',subtotal,'discountAmount',discount,'taxAmount',tax));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_invoice() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_invoice BEFORE INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION private.validate_invoice();

CREATE OR REPLACE FUNCTION public.record_invoice_payment(p_invoice_id uuid,p_account_id uuid,p_amount numeric) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE i public.invoices; a public.accounts;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT * INTO i FROM public.invoices WHERE id=p_invoice_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice unavailable'; END IF;
  IF i.status='paid' THEN RETURN; END IF;
  SELECT * INTO a FROM public.accounts WHERE id=p_account_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable'; END IF;
  IF p_amount IS NULL OR p_amount<=0 OR p_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid received amount'; END IF;
  IF coalesce(i.items->'metadata'->>'currency','USD')=a.currency AND p_amount<>i.amount THEN RAISE EXCEPTION 'Payment amount must match invoice'; END IF;
  PERFORM set_config('dimex.compound','yes',true);
  INSERT INTO public.transactions(user_id,date,description,amount,type,category,account,account_id,currency,status,invoice_id)
  VALUES(auth.uid(),current_date,'Invoice Payment - '||i.invoice_number,p_amount,'income','Invoice Payment',a.name,a.id,a.currency,'completed',i.id);
  UPDATE public.invoices SET status='paid' WHERE id=i.id;
END $$;
REVOKE ALL ON FUNCTION public.record_invoice_payment(uuid,uuid,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(uuid,uuid,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.transfer_funds(p_from uuid,p_to uuid,p_amount numeric,p_description text) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE a public.accounts; b public.accounts; transfer uuid:=gen_random_uuid();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF p_from=p_to OR p_amount IS NULL OR p_amount<=0 OR p_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid transfer'; END IF;
  PERFORM id FROM public.accounts WHERE id IN (p_from,p_to) AND user_id=auth.uid() ORDER BY id FOR UPDATE;
  SELECT * INTO a FROM public.accounts WHERE id=p_from AND user_id=auth.uid();
  SELECT * INTO b FROM public.accounts WHERE id=p_to AND user_id=auth.uid();
  IF a.id IS NULL OR b.id IS NULL OR a.currency<>b.currency OR a.balance<p_amount THEN RAISE EXCEPTION 'Choose same-currency accounts with sufficient funds'; END IF;
  PERFORM set_config('dimex.compound','yes',true);
  INSERT INTO public.transactions(user_id,date,description,amount,type,category,account,account_id,currency,status,transfer_id)
  VALUES(auth.uid(),current_date,coalesce(nullif(p_description,''),'Account transfer'),p_amount,'expense','Transfer',a.name,a.id,a.currency,'completed',transfer),
        (auth.uid(),current_date,coalesce(nullif(p_description,''),'Account transfer'),p_amount,'income','Transfer',b.name,b.id,b.currency,'completed',transfer);
END $$;
REVOKE ALL ON FUNCTION public.transfer_funds(uuid,uuid,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid,uuid,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.borrowed_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF TG_OP='UPDATE' AND OLD.debt_type='credit' AND (NEW.principal<>OLD.principal OR NEW.credited_account_id IS DISTINCT FROM OLD.credited_account_id OR NEW.debt_type<>OLD.debt_type) THEN RAISE EXCEPTION 'Original credit receipt is immutable'; END IF;
  IF TG_OP='INSERT' AND NEW.debt_type='credit' THEN
    UPDATE public.accounts SET balance=balance+NEW.principal WHERE id=NEW.credited_account_id AND user_id=auth.uid() AND currency=NEW.currency;
    IF NOT FOUND OR NEW.principal<=0 THEN RAISE EXCEPTION 'Select the receiving account and positive principal'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.borrowed_credit() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER borrowed_credit BEFORE INSERT OR UPDATE ON public.emis FOR EACH ROW EXECUTE FUNCTION private.borrowed_credit();
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
