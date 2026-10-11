CREATE OR REPLACE FUNCTION private.preserve_account_currency() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.currency IS DISTINCT FROM OLD.currency AND (
    EXISTS (SELECT 1 FROM public.transactions WHERE account_id=OLD.id) OR
    EXISTS (SELECT 1 FROM public.emis WHERE credited_account_id=OLD.id)
  ) THEN
    RAISE EXCEPTION 'Keep the original currency for accounts with financial history';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.preserve_account_currency() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preserve_account_currency BEFORE UPDATE OF currency ON public.accounts
FOR EACH ROW EXECUTE FUNCTION private.preserve_account_currency();
