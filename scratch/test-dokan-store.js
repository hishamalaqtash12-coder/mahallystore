const headers = new Headers();
headers.append("Authorization", "Basic " + Buffer.from("ck_24d6d634dbd1810bc7583689c8a93165b4c48970:cs_bb82e6ef296ec53f5080c10ebbf4f32af9cd0808").toString('base64'));

fetch('http://mahally-test.local/wp-json/dokan/v1/products?vendor_id=35', { headers })
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  });
