import fetch from 'node-fetch';

async function check() {
  const urls = [
    'https://openapi.redx.com.bd/v1.0.0-beta/shops',
    'https://openapi.redx.com.bd/v1.0.0/profile',
    'https://openapi.redx.com.bd/v1.0.0/shops'
  ];
  for (const u of urls) {
      const r = await fetch(u, {
        method: 'GET',
        headers: {
          'API-ACCESS-TOKEN': 'Bearer test',
          'Content-Type': 'application/json'
        }
      });
      console.log(u, r.status, await r.json().catch(e => e.message));
  }
}
check();
