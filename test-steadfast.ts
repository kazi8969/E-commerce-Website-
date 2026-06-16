import fetch from 'node-fetch';

async function check() {
  const r = await fetch('https://portal.packzy.com/api/v1/status_by_cid/1234', {
    method: 'GET',
    headers: {
      'Api-Key': 'test',
      'Secret-Key': 'test',
      'Content-Type': 'application/json'
    }
  });
  console.log(r.status, await r.json());
}
check();
