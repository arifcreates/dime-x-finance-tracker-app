BEGIN;
INSERT INTO auth.users(id,email) VALUES
('11111111-1111-4111-8111-111111111111','planning-one@example.com'),
('22222222-2222-4222-8222-222222222222','planning-two@example.com');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
UPDATE public.profiles SET preferences=preferences||'{"planning":{"currency":"INR","taxReserve":1000,"otherReserve":2000,"buffer":500}}'::jsonb WHERE id=auth.uid();
DO $$ BEGIN
 ASSERT (SELECT preferences->'planning'->>'taxReserve' FROM public.profiles WHERE id=auth.uid())='1000','Reserve persistence failed';
 ASSERT (SELECT preferences->>'currency' FROM public.profiles WHERE id=auth.uid())='INR','Saving reserves lost home currency';
 UPDATE public.profiles SET preferences='{}' WHERE id='22222222-2222-4222-8222-222222222222';
 ASSERT NOT FOUND,'Cross-user preference update was allowed';
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM public.profiles WHERE preferences ? 'planning')=0,'Reserve data leaked to another user';
END $$;
ROLLBACK;
SELECT 'Planning preferences saved and isolated; test data rolled back.' AS result;
