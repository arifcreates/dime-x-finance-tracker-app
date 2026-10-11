BEGIN;
INSERT INTO auth.users(id,email) VALUES
('11111111-1111-4111-8111-111111111111','quick-test-one@example.com'),
('22222222-2222-4222-8222-222222222222','quick-test-two@example.com');
INSERT INTO public.accounts(id,user_id,name,type,balance,currency) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Quick test cash','cash',1000,'INR'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Other user','cash',1000,'INR');
INSERT INTO public.categories(id,user_id,name,bucket) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','Private food','flex');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
INSERT INTO public.categories(id,user_id,name,bucket) VALUES
('dddddddd-dddd-4ddd-8ddd-dddddddddddd',auth.uid(),'Food','flex');
INSERT INTO public.category_rules(user_id,match_text,category_id) VALUES(auth.uid(),'swiggy','dddddddd-dddd-4ddd-8ddd-dddddddddddd');
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM public.categories)=1,'Category SELECT isolation failed';
 ASSERT (SELECT count(*) FROM public.category_rules)=1,'Rule save failed';
 BEGIN
  INSERT INTO public.category_rules(user_id,match_text,category_id) VALUES(auth.uid(),'foreign','cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  RAISE EXCEPTION 'Foreign category allowed';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.categories(user_id,name,bucket) VALUES('22222222-2222-4222-8222-222222222222','Forbidden','flex');
  RAISE EXCEPTION 'Foreign owner allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.categories SET user_id='22222222-2222-4222-8222-222222222222' WHERE name='Food';
  RAISE EXCEPTION 'Owner reassignment allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.categories SET name='Hacked' WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 ASSERT NOT FOUND,'Foreign update allowed';
 DELETE FROM public.categories WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 ASSERT NOT FOUND,'Foreign deletion allowed';
 -- An invalid second row must roll back the first debit and its trigger.
 BEGIN
  INSERT INTO public.transactions(user_id,date,description,amount,type,category,account,account_id,status,source) VALUES
  (auth.uid(),current_date,'Fictional meal',450,'expense','Food','Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','ai'),
  (auth.uid(),current_date,'Foreign account',100,'expense','Food','Other user','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','completed','ai');
  RAISE EXCEPTION 'Foreign account batch allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Foreign account batch allowed' THEN RAISE; END IF; END;
 ASSERT (SELECT count(*) FROM public.transactions)=0,'Batch partially saved';
 ASSERT (SELECT balance FROM public.accounts)=1000,'Batch partially debited';
 BEGIN
  INSERT INTO public.transactions(user_id,date,description,amount,type,category,category_id,account,account_id,status,source)
  VALUES(auth.uid(),current_date,'Foreign category',100,'expense','Food','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','ai');
  RAISE EXCEPTION 'Foreign transaction category allowed';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 ASSERT (SELECT balance FROM public.accounts)=1000,'Rejected category changed balance';
END $$;
INSERT INTO public.transactions(id,user_id,date,description,amount,type,category,category_id,account,account_id,status,source) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',auth.uid(),current_date,'Meal',450,'expense','Food','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','manual'),
('ffffffff-ffff-4fff-8fff-ffffffffffff',auth.uid(),current_date,'Work',20000,'income','Work',null,'Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','ai')
ON CONFLICT(id) DO UPDATE SET amount=excluded.amount;
-- Same IDs on a transport retry must not apply the balance changes twice.
INSERT INTO public.transactions(id,user_id,date,description,amount,type,category,category_id,account,account_id,status,source) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',auth.uid(),current_date,'Meal',450,'expense','Food','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','manual'),
('ffffffff-ffff-4fff-8fff-ffffffffffff',auth.uid(),current_date,'Work',20000,'income','Work',null,'Quick test cash','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','completed','ai')
ON CONFLICT(id) DO UPDATE SET amount=excluded.amount;
DO $$ BEGIN
 ASSERT (SELECT balance FROM public.accounts)=20550,'Batch retry double applied';
 ASSERT (SELECT count(*) FROM public.transactions)=2,'Duplicate entries';
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM public.category_rules)=0,'Rule SELECT isolation failed';
 ASSERT (SELECT count(*) FROM public.transactions)=0,'Transaction SELECT isolation failed';
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.categories; RAISE EXCEPTION 'Anonymous categories readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM public.category_rules; RAISE EXCEPTION 'Anonymous rules readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'Quick-add ownership, atomicity and retry assertions passed; test data rolled back.' AS result;
