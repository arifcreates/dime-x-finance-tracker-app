-- BEFORE triggers must validate only: upsert runs BEFORE INSERT even when
-- it ultimately updates an existing row. Apply financial deltas AFTER success.
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
 PERFORM id FROM public.accounts WHERE id IN (old_account,new_account) ORDER BY id FOR UPDATE;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 SELECT * INTO a FROM public.accounts WHERE id=new_account AND user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable'; END IF;
 NEW.account:=a.name; NEW.currency:=a.currency;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION private.apply_ledger_balance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD.status='completed' AND OLD.account_id IS NOT NULL THEN
  UPDATE public.accounts SET balance=balance-CASE WHEN OLD.type='income' THEN OLD.amount ELSE -OLD.amount END WHERE id=OLD.account_id AND user_id=auth.uid();
 END IF;
 IF TG_OP<>'DELETE' AND NEW.status='completed' THEN
  UPDATE public.accounts SET balance=balance+CASE WHEN NEW.type='income' THEN NEW.amount ELSE -NEW.amount END WHERE id=NEW.account_id AND user_id=auth.uid();
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION private.apply_ledger_balance() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER apply_ledger_balance AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION private.apply_ledger_balance();
DROP TRIGGER borrowed_credit ON public.emis;
CREATE OR REPLACE FUNCTION private.borrowed_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF TG_OP='UPDATE' AND (OLD.debt_type='credit' OR NEW.debt_type='credit') AND (NEW.principal<>OLD.principal OR NEW.credited_account_id IS DISTINCT FROM OLD.credited_account_id OR NEW.debt_type<>OLD.debt_type) THEN RAISE EXCEPTION 'Original credit receipt is immutable'; END IF;
 IF NEW.debt_type='credit' AND NOT EXISTS(SELECT 1 FROM public.accounts WHERE id=NEW.credited_account_id AND user_id=auth.uid() AND currency=NEW.currency) THEN RAISE EXCEPTION 'Select the receiving account'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER borrowed_credit BEFORE INSERT OR UPDATE ON public.emis FOR EACH ROW EXECUTE FUNCTION private.borrowed_credit();
CREATE OR REPLACE FUNCTION private.apply_borrowed_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF NEW.debt_type='credit' THEN
  IF NEW.principal<=0 THEN RAISE EXCEPTION 'Principal must be positive'; END IF;
  UPDATE public.accounts SET balance=balance+NEW.principal WHERE id=NEW.credited_account_id AND user_id=auth.uid();
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION private.apply_borrowed_credit() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER apply_borrowed_credit AFTER INSERT ON public.emis FOR EACH ROW EXECUTE FUNCTION private.apply_borrowed_credit();

-- Idempotent transfer operation: the same request ID can only move money once.
DROP FUNCTION public.transfer_funds(uuid,uuid,numeric,text);
CREATE OR REPLACE FUNCTION public.transfer_funds(p_from uuid,p_to uuid,p_amount numeric,p_description text,p_request_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE a public.accounts; b public.accounts;
BEGIN
 IF auth.uid() IS NULL OR p_request_id IS NULL THEN RAISE EXCEPTION 'Sign in and provide a request ID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 IF EXISTS(SELECT 1 FROM public.transactions WHERE transfer_id=p_request_id AND user_id=auth.uid()) THEN RETURN; END IF;
 IF p_from=p_to OR p_amount IS NULL OR p_amount<=0 OR p_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid transfer'; END IF;
 PERFORM id FROM public.accounts WHERE id IN (p_from,p_to) AND user_id=auth.uid() ORDER BY id FOR UPDATE;
 SELECT * INTO a FROM public.accounts WHERE id=p_from AND user_id=auth.uid();
 SELECT * INTO b FROM public.accounts WHERE id=p_to AND user_id=auth.uid();
 IF a.id IS NULL OR b.id IS NULL OR a.currency<>b.currency OR a.balance<p_amount THEN RAISE EXCEPTION 'Choose same-currency accounts with sufficient funds'; END IF;
 PERFORM set_config('dimex.compound','yes',true);
 INSERT INTO public.transactions(user_id,date,description,amount,type,category,account,account_id,currency,status,transfer_id)
 VALUES(auth.uid(),current_date,coalesce(nullif(p_description,''),'Account transfer'),p_amount,'expense','Transfer',a.name,a.id,a.currency,'completed',p_request_id),
 (auth.uid(),current_date,coalesce(nullif(p_description,''),'Account transfer'),p_amount,'income','Transfer',b.name,b.id,b.currency,'completed',p_request_id);
END $$;
REVOKE ALL ON FUNCTION public.transfer_funds(uuid,uuid,numeric,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid,uuid,numeric,text,uuid) TO authenticated;

CREATE TABLE public.subscriptions(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 provider_id text UNIQUE,
 status text NOT NULL DEFAULT 'creating',
 current_end timestamptz,
 paid_count integer NOT NULL DEFAULT 0,
 cancel_at_cycle_end boolean NOT NULL DEFAULT false,
 last_event_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_subscription ON public.subscriptions FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
REVOKE ALL ON public.subscriptions FROM anon;
GRANT ALL ON public.subscriptions TO service_role;
CREATE TABLE private.billing_events(event_id text PRIMARY KEY,provider_id text NOT NULL,received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.ai_usage(user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,usage_date date NOT NULL,requests integer NOT NULL DEFAULT 0,PRIMARY KEY(user_id,usage_date));
ALTER TABLE private.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_subscription_checkout(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.subscriptions;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
 SELECT * INTO s FROM public.subscriptions WHERE user_id=p_user_id FOR UPDATE;
 IF FOUND AND s.status NOT IN ('cancelled','completed','expired') THEN RETURN false; END IF;
 INSERT INTO public.subscriptions(user_id,status) VALUES(p_user_id,'creating') ON CONFLICT(user_id) DO UPDATE SET status='creating',provider_id=NULL,current_end=NULL,paid_count=0,cancel_at_cycle_end=false,last_event_at=NULL,updated_at=now();
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_subscription_checkout(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_subscription_checkout(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_subscription_event(p_event_id text,p_provider_id text,p_status text,p_current_end timestamptz,p_paid_count integer,p_event_at timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.subscriptions;
BEGIN
 SELECT * INTO s FROM public.subscriptions WHERE provider_id=p_provider_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not registered yet'; END IF;
 INSERT INTO private.billing_events(event_id,provider_id) VALUES(p_event_id,p_provider_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 IF s.last_event_at IS NOT NULL AND p_event_at<s.last_event_at THEN RETURN; END IF;
 UPDATE public.subscriptions SET status=p_status,current_end=p_current_end,paid_count=p_paid_count,last_event_at=p_event_at,updated_at=now() WHERE user_id=s.user_id;
END $$;
REVOKE ALL ON FUNCTION public.apply_subscription_event(text,text,text,timestamptz,integer,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(text,text,text,timestamptz,integer,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_ai_usage(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE allowance integer:=10; used integer; day date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_user_id AND status='active' AND paid_count>0 AND current_end>now()) THEN allowance:=100; END IF;
 INSERT INTO private.ai_usage(user_id,usage_date,requests) VALUES(p_user_id,day,0) ON CONFLICT DO NOTHING;
 SELECT requests INTO used FROM private.ai_usage WHERE user_id=p_user_id AND usage_date=day FOR UPDATE;
 IF used>=allowance THEN RETURN jsonb_build_object('allowed',false,'remaining',0); END IF;
 UPDATE private.ai_usage SET requests=requests+1 WHERE user_id=p_user_id AND usage_date=day;
 RETURN jsonb_build_object('allowed',true,'remaining',allowance-used-1);
END $$;
REVOKE ALL ON FUNCTION public.claim_ai_usage(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_usage(uuid) TO service_role;
