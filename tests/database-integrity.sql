BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
('11111111-1111-4111-8111-111111111111','dimex-test-one@example.com','{"name":"Test One"}'),
('22222222-2222-4222-8222-222222222222','dimex-test-two@example.com','{"name":"Test Two"}');
INSERT INTO public.accounts(id,user_id,name,type,balance,currency) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','A','cash',100,'INR'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','B','cash',0,'INR'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','Private','cash',100,'INR');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.profiles)=1,'Profiles must be isolated and created automatically';
  ASSERT (SELECT count(*) FROM public.accounts)=2,'Account isolation failed';
END $$;
INSERT INTO public.transactions(id,user_id,date,description,amount,type,category,account,account_id,status) VALUES
('dddddddd-dddd-4ddd-8ddd-dddddddddddd',auth.uid(),current_date,'Income',50,'income','Work','A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed');
INSERT INTO public.transactions(id,user_id,date,description,amount,type,category,account,account_id,status) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',auth.uid(),current_date,'Income',50,'income','Work','A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed') ON CONFLICT(id) DO UPDATE SET amount=excluded.amount;
DO $$ BEGIN ASSERT (SELECT balance FROM public.accounts WHERE name='A')=150,'Income did not credit account'; END $$;
DO $$ BEGIN
 BEGIN
  UPDATE public.accounts SET currency='USD' WHERE name='A';
  RAISE EXCEPTION 'Account history currency was mutable';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Account history currency was mutable' THEN RAISE; END IF; END;
END $$;
UPDATE public.transactions SET account_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',amount=40 WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
DO $$ BEGIN
 ASSERT (SELECT balance FROM public.accounts WHERE name='A')=100,'Moving transaction must reverse original account';
 ASSERT (SELECT balance FROM public.accounts WHERE name='B')=40,'Moving transaction must credit destination';
END $$;
DELETE FROM public.transactions WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
DO $$ BEGIN ASSERT (SELECT balance FROM public.accounts WHERE name='B')=0,'Deleting transaction must reverse balance'; END $$;
SELECT public.transfer_funds('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',10,'Transfer','99999999-9999-4999-8999-999999999999');
SELECT public.transfer_funds('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',10,'Transfer','99999999-9999-4999-8999-999999999999');
DO $$ BEGIN
 ASSERT (SELECT balance FROM public.accounts WHERE name='A')=90,'Transfer debit failed';
 ASSERT (SELECT balance FROM public.accounts WHERE name='B')=10,'Transfer credit failed';
 ASSERT (SELECT count(*) FROM public.transactions WHERE category='Transfer')=2,'Transfer must create paired records';
 BEGIN
   PERFORM public.transfer_funds('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',10,'Unauthorized','88888888-8888-4888-8888-888888888888');
   RAISE EXCEPTION 'Cross-user transfer was allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Cross-user transfer was allowed' THEN RAISE; END IF; END;
END $$;
INSERT INTO public.clients(id,user_id,name,email,phone,address) VALUES('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',auth.uid(),'Client','client@example.com','','');
INSERT INTO public.invoices(id,user_id,client_id,invoice_number,date,due_date,amount,status,items) VALUES
('ffffffff-ffff-4fff-8fff-ffffffffffff',auth.uid(),'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','TEST-001',current_date,current_date,999,'sent','{"lineItems":[{"description":"Work","quantity":2,"rate":25,"amount":50}],"metadata":{"currency":"INR"}}');
DO $$ BEGIN ASSERT (SELECT amount FROM public.invoices WHERE invoice_number='TEST-001')=50,'Invoice amount must be computed by backend'; END $$;
SELECT public.record_invoice_payment('ffffffff-ffff-4fff-8fff-ffffffffffff','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',50);
SELECT public.record_invoice_payment('ffffffff-ffff-4fff-8fff-ffffffffffff','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',50);
DO $$ BEGIN
 ASSERT (SELECT balance FROM public.accounts WHERE name='A')=140,'Payment retries must not double-credit';
 ASSERT (SELECT count(*) FROM public.transactions WHERE invoice_id='ffffffff-ffff-4fff-8fff-ffffffffffff')=1,'Duplicate invoice payment';
 BEGIN
   DELETE FROM public.transactions WHERE invoice_id='ffffffff-ffff-4fff-8fff-ffffffffffff';
   RAISE EXCEPTION 'Payment history was mutable';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Payment history was mutable' THEN RAISE; END IF; END;
END $$;
DELETE FROM public.clients WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
DO $$ BEGIN ASSERT (SELECT count(*) FROM public.invoices WHERE invoice_number='TEST-001' AND client_id IS NULL)=1,'Deleting client must preserve invoice'; END $$;
INSERT INTO public.emis(id,user_id,name,principal,interest_rate,tenure,monthly_amount,remaining_balance,next_due_date,debt_type,credited_account_id,currency)
VALUES('77777777-7777-4777-8777-777777777777',auth.uid(),'Borrowed',20,0,1,20,20,current_date,'credit','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','INR')
ON CONFLICT(id) DO UPDATE SET name=excluded.name;
INSERT INTO public.emis(id,user_id,name,principal,interest_rate,tenure,monthly_amount,remaining_balance,next_due_date,debt_type,credited_account_id,currency)
VALUES('77777777-7777-4777-8777-777777777777',auth.uid(),'Borrowed',20,0,1,20,20,current_date,'credit','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','INR')
ON CONFLICT(id) DO UPDATE SET name=excluded.name;
DO $$ BEGIN ASSERT (SELECT balance FROM public.accounts WHERE name='A')=160,'Credit upsert must not double-credit'; END $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ DECLARE result jsonb; n integer; BEGIN
 FOR n IN 1..10 LOOP result:=public.claim_ai_usage('11111111-1111-4111-8111-111111111111'); ASSERT (result->>'allowed')::boolean,'Free quota too small'; END LOOP;
 result:=public.claim_ai_usage('11111111-1111-4111-8111-111111111111'); ASSERT NOT (result->>'allowed')::boolean,'Quota must be enforced';
 ASSERT public.reserve_subscription_checkout('11111111-1111-4111-8111-111111111111'),'Initial checkout not reserved';
 ASSERT NOT public.reserve_subscription_checkout('11111111-1111-4111-8111-111111111111'),'Duplicate checkout allowed';
END $$;
UPDATE public.subscriptions SET provider_id='sub_TEST',status='created' WHERE user_id='11111111-1111-4111-8111-111111111111';
SELECT public.apply_subscription_event('event_TEST','sub_TEST','active',now()+interval '1 month',1,now());
SELECT public.apply_subscription_event('event_TEST','sub_TEST','cancelled',now(),1,now()+interval '1 second');
SELECT public.apply_subscription_event('event_OLD','sub_TEST','created',NULL,0,now()-interval '1 second');
DO $$ DECLARE result jsonb; BEGIN
 ASSERT (SELECT status FROM public.subscriptions WHERE provider_id='sub_TEST')='active','Duplicate or older event changed subscription';
 result:=public.claim_ai_usage('11111111-1111-4111-8111-111111111111'); ASSERT (result->>'allowed')::boolean,'Pro quota not granted';
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM public.subscriptions)=0,'Subscription isolation failed';
 BEGIN
  PERFORM public.claim_ai_usage('22222222-2222-4222-8222-222222222222'); RAISE EXCEPTION 'Client could grant quota';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'All database integrity assertions passed; test data rolled back.' AS result;
