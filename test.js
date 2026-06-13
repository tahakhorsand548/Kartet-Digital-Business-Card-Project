import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'admin', password: 'admin' })
  });
  console.log(res.status);
  console.log(await res.text());
}

test();
