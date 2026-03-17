const https = require('https');

https.get('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});