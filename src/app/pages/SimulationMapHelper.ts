export const generateRiyadhHeatmap = (scheme: number) => {
  const features: any[] = [];
  
  // Create natural-looking clusters using a Box-Muller transform for Gaussian distribution
  // Reduced points drastically & widened the spread to prevent "clumping" at zoom out
  const addCluster = (centerLng: number, centerLat: number, numPoints: number, spreadFactor: number, weightBase: number) => {
    for (let i = 0; i < numPoints; i++) {
      const u1 = Math.max(Math.random(), 0.0001);
      const u2 = Math.random();
      
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

      const skewLng = 1.2;
      const skewLat = 0.9;

      const lng = centerLng + (z0 * spreadFactor * skewLng);
      const lat = centerLat + (z1 * spreadFactor * skewLat);
      
      features.push({
        type: "Feature",
        properties: { weight: weightBase * (0.4 + 0.6 * Math.random()) },
        geometry: { type: "Point", coordinates: [lng, lat] }
      });
    }
  };

  const isS1 = scheme === 1;

  if (isS1) {
    // Scheme 1: Residential-Led (Morning Commute focus)
    // Much fewer points, wider spread = 0.03 to 0.04
    addCluster(46.605, 24.810, 250, 0.030, 0.9);  // North
    addCluster(46.665, 24.835, 200, 0.035, 0.8);  // North-East
    addCluster(46.790, 24.800, 180, 0.030, 0.8);  // East
    addCluster(46.720, 24.545, 220, 0.040, 0.9);  // South
    addCluster(46.550, 24.630, 180, 0.035, 0.8);  // West
    addCluster(46.673, 24.711, 80, 0.025, 0.6);   // Olaya (Lower)
    addCluster(46.639, 24.761, 60, 0.020, 0.5);   // KAFD (Lower)
  } else {
    // Scheme 2: Commercial & Mixed-Use (Evening Peak / Urban Hubs focus)
    addCluster(46.639, 24.761, 350, 0.020, 1.0);  // KAFD
    addCluster(46.673, 24.711, 300, 0.020, 0.95); // Olaya
    addCluster(46.602, 24.767, 250, 0.015, 0.9);  // Boulevard
    addCluster(46.729, 24.821, 180, 0.025, 0.8);  // Front
    addCluster(46.626, 24.681, 150, 0.025, 0.7);  // DQ
    addCluster(46.712, 24.640, 200, 0.020, 0.8);  // Downtown
    addCluster(46.605, 24.810, 80, 0.030, 0.5);   // North (Lower)
    addCluster(46.720, 24.545, 60, 0.035, 0.4);   // South (Lower)
  }

  // Drastically reduced background noise to prevent a muddy map
  for (let i = 0; i < 400; i++) {
    features.push({
      type: "Feature",
      properties: { weight: Math.random() * 0.1 },
      geometry: { 
        type: "Point", 
        coordinates: [
          46.50 + Math.random() * 0.35, 
          24.50 + Math.random() * 0.38
        ] 
      }
    });
  }

  return {
    type: "FeatureCollection",
    features
  };
};

/**
 * Generates an accessibility heatmap showing transit/walkability coverage.
 * mode: 'before' = current baseline, 'after' = post-intervention improvement
 */
export const generateAccessibilityHeatmap = (mode: 'before' | 'after') => {
  const features: any[] = [];

  const addCluster = (centerLng: number, centerLat: number, numPoints: number, spreadFactor: number, weightBase: number) => {
    for (let i = 0; i < numPoints; i++) {
      const u1 = Math.max(Math.random(), 0.0001);
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      const lng = centerLng + (z0 * spreadFactor * 1.2);
      const lat = centerLat + (z1 * spreadFactor * 0.9);
      features.push({
        type: "Feature",
        properties: { weight: weightBase * (0.4 + 0.6 * Math.random()) },
        geometry: { type: "Point", coordinates: [lng, lat] }
      });
    }
  };

  if (mode === 'before') {
    // Baseline: concentrated around existing transit hubs only
    addCluster(46.673, 24.711, 200, 0.015, 0.9);  // Olaya corridor
    addCluster(46.639, 24.761, 150, 0.012, 0.85); // KAFD
    addCluster(46.712, 24.640, 100, 0.020, 0.6);  // Downtown sparse
    addCluster(46.720, 24.545, 60, 0.025, 0.4);   // South minimal
  } else {
    // After: expanded coverage with new NMT + transit interventions
    addCluster(46.673, 24.711, 300, 0.025, 1.0);  // Olaya expanded
    addCluster(46.639, 24.761, 250, 0.022, 0.95); // KAFD expanded
    addCluster(46.712, 24.640, 200, 0.025, 0.85); // Downtown improved
    addCluster(46.720, 24.545, 150, 0.030, 0.7);  // South connected
    addCluster(46.605, 24.810, 180, 0.028, 0.75); // North new coverage
    addCluster(46.602, 24.767, 120, 0.018, 0.8);  // Boulevard corridor
    addCluster(46.550, 24.630, 100, 0.022, 0.6);  // West new reach
  }

  // Background noise
  for (let i = 0; i < 200; i++) {
    features.push({
      type: "Feature",
      properties: { weight: Math.random() * 0.08 },
      geometry: { type: "Point", coordinates: [46.50 + Math.random() * 0.35, 24.50 + Math.random() * 0.38] }
    });
  }

  return { type: "FeatureCollection", features };
};

/**
 * Generates an environmental resilience heatmap showing flood/temperature risk.
 * Uses warm colors (reds/oranges) for risk intensity.
 */
export const generateEnvironmentalHeatmap = () => {
  const features: any[] = [];

  const addCluster = (centerLng: number, centerLat: number, numPoints: number, spreadFactor: number, weightBase: number) => {
    for (let i = 0; i < numPoints; i++) {
      const u1 = Math.max(Math.random(), 0.0001);
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      const lng = centerLng + (z0 * spreadFactor * 1.1);
      const lat = centerLat + (z1 * spreadFactor * 1.0);
      features.push({
        type: "Feature",
        properties: { weight: weightBase * (0.3 + 0.7 * Math.random()) },
        geometry: { type: "Point", coordinates: [lng, lat] }
      });
    }
  };

  // Flood risk zones along Wadi Hanifah and low-lying areas
  addCluster(46.60, 24.65, 280, 0.028, 0.95);  // Wadi Hanifah flood plain
  addCluster(46.55, 24.60, 200, 0.035, 0.85);  // South-West basin
  addCluster(46.70, 24.55, 180, 0.030, 0.80);  // South lowlands

  // High temperature urban heat islands
  addCluster(46.673, 24.711, 220, 0.018, 0.90); // Olaya dense urban
  addCluster(46.639, 24.761, 180, 0.015, 0.85); // KAFD high-rise heat
  addCluster(46.712, 24.640, 160, 0.022, 0.75); // Downtown area

  // Moderate risk peripheral areas
  addCluster(46.790, 24.800, 100, 0.030, 0.5);  // Eastern outskirts
  addCluster(46.605, 24.810, 80, 0.025, 0.45);  // Northern edge

  // Background noise
  for (let i = 0; i < 300; i++) {
    features.push({
      type: "Feature",
      properties: { weight: Math.random() * 0.12 },
      geometry: { type: "Point", coordinates: [46.48 + Math.random() * 0.40, 24.48 + Math.random() * 0.42] }
    });
  }

  return { type: "FeatureCollection", features };
};