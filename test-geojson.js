const https = require('https');

https.get('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      const feature = geojson.features.find(f => JSON.stringify(f.properties).includes('SAU') || JSON.stringify(f.properties).includes('Saudi Arabia'));
      console.log(feature.properties);
    } catch (e) {
      console.error(e.message);
    }
  });
});
