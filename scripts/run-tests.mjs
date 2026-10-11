import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const temp=mkdtempSync(join(tmpdir(),'dimex-tests-'));
try {
 await build({entryPoints:['tests/all.test.ts'],bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'test-public-key'})},alias:{'npm:@supabase/supabase-js@2.105.4':'@supabase/supabase-js'},outfile:join(temp,'test.mjs')});
 const result=spawnSync(process.execPath,['--test',join(temp,'test.mjs')],{stdio:'inherit'});
 process.exitCode=result.status ?? 1;
} finally { rmSync(temp,{recursive:true,force:true}); }
