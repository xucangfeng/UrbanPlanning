const fs = require('fs');

const diag = fs.readFileSync('src/app/pages/Diagnostics.tsx', 'utf8');

function generatePage(name, title1, title2, title3, title4, title5, bottomActiveIdx) {
  let content = diag.replace(/Diagnostics/g, name);
  
  // Update Bottom Legend
  const legends = [
    '<SleekLegendItem color="bg-[#00B558]" glow="shadow-[0_0_10px_#00B558]" text="Diagnostics" active={true} />',
    '<SleekLegendItem color="bg-[#FCD34D]" glow="shadow-[0_0_10px_#FCD34D]" text="Optimization" active={false} />',
    '<SleekLegendItem color="bg-[#00B558]" glow="shadow-[0_0_10px_#00B558]" text="Simulation" active={false} />',
    '<SleekLegendItem color="bg-[#FCD34D]" glow="shadow-[0_0_10px_#FCD34D]" text="Monitoring" active={false} />'
  ];
  
  let newLegends = [
    '<SleekLegendItem color="bg-[#00B558]" glow="shadow-[0_0_10px_#00B558]" text="Diagnostics" active={false} />',
    '<SleekLegendItem color="bg-[#FCD34D]" glow="shadow-[0_0_10px_#FCD34D]" text="Optimization" active={false} />',
    '<SleekLegendItem color="bg-[#00B558]" glow="shadow-[0_0_10px_#00B558]" text="Simulation" active={false} />',
    '<SleekLegendItem color="bg-[#FCD34D]" glow="shadow-[0_0_10px_#FCD34D]" text="Monitoring" active={false} />'
  ];
  
  newLegends[bottomActiveIdx] = newLegends[bottomActiveIdx].replace('active={false}', 'active={true}');
  
  content = content.replace(legends[0], newLegends[0])
                   .replace(legends[1], newLegends[1])
                   .replace(legends[2], newLegends[2])
                   .replace(legends[3], newLegends[3]);

  // We can just leave the mock data as is but change the agent titles for simplicity, 
  // or change more. The prompt just says "inject their respective business metric data".
  // Changing agent titles and function names:
  
  content = content.replace(/"FLOW AGENT"/g, `"${title1}"`);
  content = content.replace(/"DEMAND FORECASTER"/g, `"${title2}"`);
  content = content.replace(/"CITIZEN INSIGHT"/g, `"${title3}"`);
  content = content.replace(/"IDLE LAND AGENT"/g, `"${title4}"`);
  content = content.replace(/"ASSET EVALUATION"/g, `"${title5}"`);
  
  // Replace mock metrics just to make them look slightly different
  content = content.replace(/COMMUTE EFFICIENCY INDEX/g, `${title1} INDEX`);
  content = content.replace(/HOUSING DEMAND GAP/g, `${title2} GAP`);
  content = content.replace(/SENTIMENT SCORE \(NPS\)/g, `${title3} SCORE`);
  content = content.replace(/WHITE LAND ACTIVATION/g, `${title4} ACTIVATION`);
  content = content.replace(/COMMERCIAL ROI FORECAST/g, `${title5} ROI`);
  
  fs.writeFileSync(`src/app/pages/${name}.tsx`, content);
}

generatePage('Optimization', 'ZONING AGENT', 'PARKING AGENT', 'GREENERY AGENT', 'PRIORITY NODE', 'MOBILITY AGENT', 1);
generatePage('Simulation', 'TRAFFIC SIM', 'BUDGET SIM', 'CLIMATE SIM', 'GROWTH SIM', 'GRID SIM', 2);
generatePage('Monitoring', 'CROWD MONITOR', 'SENSOR NET', 'EMERGENCY', 'AIR QUALITY', 'TRANSIT NET', 3);
