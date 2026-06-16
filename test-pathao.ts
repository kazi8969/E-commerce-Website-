import fetch from 'node-fetch'; // wait, fetch is built-in in modern node

async function check() {
  const r = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/issue-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'test',
      client_secret: 'test',
      grant_type: 'client_credentials'
    })
  });
  console.log(r.status, await r.json());
}
check();
