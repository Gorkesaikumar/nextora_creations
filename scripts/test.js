// Integration tests own an isolated, disposable PostgreSQL container. No existing DB is touched.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
const name = `nextora-test-${randomBytes(6).toString('hex')}`;
const password = randomBytes(24).toString('hex');
let started = false;
const run = (file, args, env) => new Promise((resolve, reject) => {
  const child = spawn(file,args,{stdio:'inherit',env});
  child.on('error',reject); child.on('exit',code=>resolve(code ?? 1));
});
try {
  execFileSync('docker',['run','--detach','--rm','--name',name,'-e',`POSTGRES_PASSWORD=${password}`,
    '-e','POSTGRES_DB=nc_test','-p','127.0.0.1::5432','postgres:17-alpine'],{stdio:'pipe'});
  started = true;
  const port = execFileSync('docker',['port',name,'5432/tcp'],{encoding:'utf8'}).trim().split(':').at(-1);
  const url = `postgresql://postgres:${password}@127.0.0.1:${port}/nc_test`;
  let ready = false;
  for(let attempt=0;attempt<60;attempt++) {
    const client = new pg.Client({connectionString:url,connectionTimeoutMillis:1000});
    try { await client.connect(); await client.query('SELECT 1'); ready=true; break; }
    catch { await new Promise(r=>setTimeout(r,500)); }
    finally { await client.end().catch(()=>{}); }
  }
  if(!ready) throw new Error('Test PostgreSQL did not become ready.');
  const env={...process.env,DATABASE_URL:url,NEXTORA_TEST_DATABASE:'true',APP_URL:'http://localhost:5173',NODE_ENV:'test'};
  if(process.argv.includes('--ui')) {
    const seeded=await run(process.execPath,['tests/seed-ui.js'],env);
    if(seeded) throw new Error('UI fixture setup failed.');
    env.CERTIFICATE_SIGNATURE_PATH='tmp/test-signature.png';
    process.exitCode=await run(process.execPath,['node_modules/@playwright/test/cli.js','test'],env);
  } else {
    process.exitCode=await run(process.execPath,['--test','tests/domain.test.js','tests/integration.test.js'],env);
  }
} finally {
  if(started) execFileSync('docker',['stop',name],{stdio:'pipe'});
}
