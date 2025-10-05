// processing_sim_data.js
// Produce hypothetical impact start states that roughly match actual close approach directions.
// Export: processingSimData(data, opts)
//
// Usage:
//   import { processingSimData } from "./processing_sim_data.js";
//   const processed = processingSimData(rawAsteroidJson);
//
/*  Notes:
    - This is an approximation pipeline intended for visualization/hypothesis scenarios only.
    - Earth-centered coordinates (km). Earth radius = 6371 km.
    - Backpropagation distance default = 2,000,000 km (configurable via opts.backpropKm).
    - Matching is performed by sampling random impact site+angles and picking the candidate whose
      incoming direction (unit vector) minimizes angular difference to the 'actual' incoming direction
      obtained from orbital propagation (Kepler two-body, simplified).
    - Likelihood is a conservative heuristic combining angular mismatch and speed deviation.
*/

export function processingSimData(data, opts = {}) {
  // ---------- options ----------



  const samplesPerCA = opts.samplesPerCloseApproach || 1000; // increase for better matches (slower)
  const BACKPROP_KM = opts.backpropKm || 2_000_000;
  const EARTH_RADIUS_KM = 6371;
  const DEFAULT_SPEED_KMS = 20.0; // fallback speed if none available
  const DENSITY_KG_M3 = opts.densityKgM3 || 3000; // used only for rough mass/energy
  const CONSERVATIVE_FACTOR = opts.conservativeFactor || 1.0; // adjust likelihood conservativeness

  // ---------- constants for orbital propagation ----------
  const AU_KM = 149597870.7;
  const DAY_SECONDS = 86400;
  const GAUSSIAN_K = 0.01720209895;
  const MU_SUN_AU3_PER_DAY2 = GAUSSIAN_K * GAUSSIAN_K;

  // ---------- small vector helpers ----------
  const V = {
    add: (a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
    sub: (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
    mul: (a,s) => [a[0]*s, a[1]*s, a[2]*s],
    dot: (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
    len: (a) => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]),
    norm: (a) => {
      const L = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]) || 1;
      return [a[0]/L, a[1]/L, a[2]/L];
    },
    cross: (a,b) => [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ],
    angleBetween: (a,b) => {
      const na = V.norm(a), nb = V.norm(b);
      const d = V.dot(na, nb);
      return Math.acos(Math.max(-1, Math.min(1, d))); // radians
    }
  };

  const deg2rad = d => d * Math.PI / 180;

  // ---------- light orbital helpers (Kepler solver & state vector) ----------
  // Solve Kepler's equation (M in radians)
  function solveKepler(M, e, tol = 1e-12, maxIter = 50) {
    M = ((M % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < maxIter; i++) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      const dE = f / fp;
      E -= dE;
      if (Math.abs(dE) < tol) break;
    }
    return E;
  }

  // Convert YYYY-MM-DD to Julian Date (00:00 UTC)
  function dateToJD(dateStr) {
    const [Y, M, D] = dateStr.split("-").map(Number);
    let y = Y, m = M;
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + D + B - 1524.5;
    return JD;
  }

  // Compute heliocentric r (AU) and v (AU/day) approx from orbital elements (simplified)
  // elems: { semi_major_axis, eccentricity, inclination, ascending_node_longitude, perihelion_argument, mean_anomaly, epoch_osculation, mean_motion }
  function stateFromElementsAtJD(elems, JD) {
    // parse floats defensively
    const a = Number(elems.semi_major_axis);
    const e = Number(elems.eccentricity);
    const i = deg2rad(Number(elems.inclination));
    const Omega = deg2rad(Number(elems.ascending_node_longitude));
    const omega = deg2rad(Number(elems.perihelion_argument));
    const M0 = deg2rad(Number(elems.mean_anomaly));
    const epoch = Number(elems.epoch_osculation);
    const n_deg_day = Number(elems.mean_motion);
    const n = deg2rad(n_deg_day || (360 / Number(elems.orbital_period || 1))); // fallback

    const dt = JD - epoch;
    const M = M0 + n * dt;
    const E = solveKepler(M, e);

    const cosE = Math.cos(E), sinE = Math.sin(E);
    const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e*e));
    const x_orb = a * (cosE - e);
    const y_orb = a * (sqrt1me2 * sinE);
    const r = a * (1 - e * cosE);

    const mu = MU_SUN_AU3_PER_DAY2;
    const factor = Math.sqrt(mu * a) / Math.max(r, 1e-12);
    const vx_orb = -factor * sinE;
    const vy_orb = factor * sqrt1me2 * cosE;

    const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
    const cosi = Math.cos(i), sini = Math.sin(i);
    const cosw = Math.cos(omega), sinw = Math.sin(omega);

    const r11 = cosO * cosw - sinO * sinw * cosi;
    const r12 = -cosO * sinw - sinO * cosw * cosi;
    const r13 = sinO * sini;

    const r21 = sinO * cosw + cosO * sinw * cosi;
    const r22 = -sinO * sinw + cosO * cosw * cosi;
    const r23 = -cosO * sini;

    const r31 = sinw * sini;
    const r32 = cosw * sini;
    const r33 = cosi;

    const rx = r11 * x_orb + r12 * y_orb;
    const ry = r21 * x_orb + r22 * y_orb;
    const rz = r31 * x_orb + r32 * y_orb;

    const vx = r11 * vx_orb + r12 * vy_orb;
    const vy = r21 * vx_orb + r22 * vy_orb;
    const vz = r31 * vx_orb + r32 * vy_orb;

    return { r_helio: [rx, ry, rz], v_helio: [vx, vy, vz] };
  }

  // convert AU, AU/day -> km, km/s
  function toKM(posAU, velAUperDay) {
    return {
      posKM: [posAU[0]*AU_KM, posAU[1]*AU_KM, posAU[2]*AU_KM],
      velKMps: [velAUperDay[0]*AU_KM/DAY_SECONDS, velAUperDay[1]*AU_KM/DAY_SECONDS, velAUperDay[2]*AU_KM/DAY_SECONDS]
    };
  }

  // ---------- geometry & candidate builder ----------
  function latLonToECEF(latDeg, lonDeg, radiusKm = EARTH_RADIUS_KM) {
    const lat = deg2rad(latDeg), lon = deg2rad(lonDeg);
    const x = radiusKm * Math.cos(lat) * Math.cos(lon);
    const y = radiusKm * Math.cos(lat) * Math.sin(lon);
    const z = radiusKm * Math.sin(lat);
    return [x,y,z];
  }

  // Build incoming unit vector that hits surface at impactPosKM with given tilt and azimuth
  function incomingDirectionForSurfacePoint(impactPosKM, impactAngleDeg = 0, azimuthDeg = 0) {
    const normalInward = V.mul(V.norm(impactPosKM), -1);
    const angle = deg2rad(impactAngleDeg);
    const az = deg2rad(azimuthDeg);
    let ref = [0,0,1];
    if (Math.abs(V.dot(V.norm(impactPosKM), ref)) > 0.999) ref = [0,1,0];
    const t1 = V.norm(V.cross(ref, normalInward));
    const t2 = V.cross(normalInward, t1);
    const tiltComponent = V.add(V.mul(t1, Math.cos(az)), V.mul(t2, Math.sin(az)));
    const incoming = V.add(V.mul(normalInward, Math.cos(angle)), V.mul(tiltComponent, Math.sin(angle)));
    return V.norm(incoming);
  }

  // rough mass estimate from mean diameter (meters) and density
  function estimateMassKg(meanDiameterMeters, densityKgPerM3 = DENSITY_KG_M3) {
    if (!meanDiameterMeters) return null;
    const r = meanDiameterMeters/2;
    const volume = (4/3) * Math.PI * Math.pow(r,3);
    return volume * densityKgPerM3;
  }

  function kineticEnergyJoules(massKg, speedKmS) {
    if (!massKg) return null;
    const v = speedKmS * 1000;
    return 0.5 * massKg * v * v;
  }

  // Build a candidate hypothetical impact (guarantees straight-line collision)
  function buildHypothetical(impactLatDeg, impactLonDeg, impactAngleDeg, azimuthDeg, speedKmS, backpropKm = BACKPROP_KM, diameterMetersMean = null) {
    const impactPosKM = latLonToECEF(impactLatDeg, impactLonDeg, EARTH_RADIUS_KM);
    const incomingUnit = incomingDirectionForSurfacePoint(impactPosKM, impactAngleDeg, azimuthDeg);
    const impactVelocityKMps = V.mul(incomingUnit, speedKmS);
    const startPosKM = V.sub(impactPosKM, V.mul(incomingUnit, backpropKm));
    const startVelKMps = impactVelocityKMps.slice();
    const massKg = diameterMetersMean ? estimateMassKg(diameterMetersMean) : null;
    const KEJ = massKg ? kineticEnergyJoules(massKg, speedKmS) : null;
    return {
      impactLatDeg, impactLonDeg, impactAngleDeg, azimuthDeg,
      impactPosKM, incomingUnit, impactVelocityKMps, startPosKM, startVelKMps,
      diameterMetersMean, massKg, KEJ
    };
  }

  // choose best matching hypothetical by sampling random candidates and minimizing angular mismatch
  function findBestMatchForCloseApproach(caRelativeVelVecKMps, diameterMetersMean, samples = samplesPerCA) {
    const relVel = caRelativeVelVecKMps;
    const relSpeed = V.len(relVel) || DEFAULT_SPEED_KMS;
    const desiredIncoming = V.mul(V.norm(relVel), -1); // direction from far->towards Earth

    let best = null;
    for (let s = 0; s < samples; s++) {
      const lat = randomInRange(-80, 80);
      const lon = randomInRange(-180, 180);
      const angle = randomInRange(0, 60);
      const az = randomInRange(0, 360);
      const cand = buildHypothetical(lat, lon, angle, az, relSpeed, BACKPROP_KM, diameterMetersMean);
      const angRad = V.angleBetween(cand.incomingUnit, desiredIncoming);
      const angDeg = angRad * 180 / Math.PI;
      if (!best || angDeg < best.angDeg) {
        best = { angDeg, cand };
      }
    }
    return { desiredIncoming, relSpeed, bestAngleDeg: best.angDeg, bestCandidate: best.cand };
  }

  function randomInRange(a,b) { return a + Math.random()*(b-a); }

  // ---------- main pipeline ----------
  const output = {
    inputId: data.id || null,
    name: data.name || null,
    generatedAt: new Date().toISOString(),
    matches: []
  };

  // mean diameter (meters) available in input
  const dd = (data.estimated_diameter_meters || {});
  const meanDiameterMeters = (Number(dd.estimated_diameter_min || 0) + Number(dd.estimated_diameter_max || 0)) / 2 || null;

  // Prepare orbital elements for propagation if present
  const od = data.orbital_data || null;
  const orbitalElems = od ? {
    semi_major_axis: od.semi_major_axis,
    eccentricity: od.eccentricity,
    inclination: od.inclination,
    ascending_node_longitude: od.ascending_node_longitude,
    perihelion_argument: od.perihelion_argument,
    mean_anomaly: od.mean_anomaly,
    epoch_osculation: od.epoch_osculation,
    mean_motion: od.mean_motion,
    orbital_period: od.orbital_period
  } : null;

  // Earth heliocentric simplification: assume Earth at 1 AU along +X; velocity ~ +Y (circular approximation)
  const earthHelioAU = [1,0,0];
  const earthSpeedAUperDay = Math.sqrt(MU_SUN_AU3_PER_DAY2 / 1.0);
  const earthVelHelio = [0, earthSpeedAUperDay, 0];

  // For each close approach pair, try to compute relative velocity vector from orbital propagation if possible.
  const cas = data.close_approach_data || [];

  for (const ca of cas) {
    if (ca.orbiting_body !== "Earth") continue;
    
    // parse numeric fields
    const miss_distance_km = Number(ca.miss_distance_km || ca.miss_distance || 0);
    const relSpeed_kps_fromAPI = ca.relative_velocity_kps ? Number(ca.relative_velocity_kps) : (ca.relative_velocity_kph ? Number(ca.relative_velocity_kph)/3600 : null);

    // Attempt to compute heliocentric and earth-relative state at close approach date using orbital elements.
    let relPosKM = null, relVelKMs = null, heliocentric = null;
    let usedPropagation = false;

    if (orbitalElems && orbitalElems.semi_major_axis) {
      try {
        const JD = dateToJD(ca.close_approach_date);
        const st = stateFromElementsAtJD(orbitalElems, JD);
        const { posKM: astPosKM, velKMps: astVelKMps } = toKM(st.r_helio, st.v_helio);
        const earthPosKM = [earthHelioAU[0]*AU_KM, earthHelioAU[1]*AU_KM, earthHelioAU[2]*AU_KM];
        const earthVelKMs = [earthVelHelio[0]*AU_KM/DAY_SECONDS, earthVelHelio[1]*AU_KM/DAY_SECONDS, earthVelHelio[2]*AU_KM/DAY_SECONDS];
        relPosKM = V.sub(astPosKM, earthPosKM);
        relVelKMs = V.sub(astVelKMps, earthVelKMs);
        heliocentric = { r_km: astPosKM, v_km_s: astVelKMps };
        usedPropagation = true;
      } catch (e) {
        // fallback to API speed-only heuristics below
        usedPropagation = false;
      }
    }

    // If propagation failed, build an ad-hoc relative velocity vector pointing toward Earth with magnitude from API or default.
    if (!usedPropagation) {
      const speed = relSpeed_kps_fromAPI || DEFAULT_SPEED_KMS;
      // choose a pseudo-random direction (but deterministic-ish using date string hash)
      const seed = Math.abs(hashString(ca.close_approach_date || Math.random().toString())) % 360;
      const lat = 0; const lon = seed - 180;
      const impactPosKM = latLonToECEF(lat, lon, EARTH_RADIUS_KM);
      const incoming = incomingDirectionForSurfacePoint(impactPosKM, 10, seed);
      // relVel is asteroid velocity relative to Earth: we'll set it so asteroid moves toward Earth (negative of incoming)
      relVelKMs = V.mul(incoming, -speed);
      relPosKM = V.mul(incoming, miss_distance_km || 1e6); // place at miss_distance on incoming line
      heliocentric = null;
    }

    // Find best match by sampling candidates
    const match = findBestMatchForCloseApproach(relVelKMs, meanDiameterMeters, samplesPerCA);
    const best = match.bestCandidate;
    const angMismatch = match.bestAngleDeg; // degrees
    const speedActual = match.relSpeed; // km/s
    // compute speed difference percent between actual and candidate (candidate speed == actual by construction)
    const speedDiffPct = 0; // by design we use same speed value for candidate
    // conservative likelihood heuristic:
    // Start with 100%, subtract penalties:
    //  - angular mismatch: penalty = min(60 deg, angMismatch) * 0.9
    //  - missDistance penalty: if original miss_distance_km small, slight penalty for uncertainty (use normalized)
    //  - systemic uncertainty: use user's conservative factor
    const angPenalty = Math.min(angMismatch, 60) * 0.9; // up to ~54%
    const missPenalty = Math.min((miss_distance_km || 1e7) / 1e7, 1.0) * 10; // small penalty up to 10%
    const speedPenalty = Math.min(Math.abs(speedDiffPct), 1.0) * 30; // but it's 0 here
    let likelihoodPct = Math.max(0, 100 - CONSERVATIVE_FACTOR * (angPenalty + missPenalty + speedPenalty));
    // be conservative: cap at <= 95% (never claim near certain)
    likelihoodPct = Math.min(likelihoodPct, 95);

    // also provide an even-more-conservative bound (lower probability)
    const conservativeUpperBoundPct = Math.max(1, Math.round(likelihoodPct * 0.7)); // 70% of estimate

    // Build the response object for this close approach
    output.matches.push({
      close_approach_date: ca.close_approach_date,
      orbiting_body: ca.orbiting_body,
      miss_distance_km: miss_distance_km,
      rel_speed_km_s_estimate: Number((V.len(relVelKMs) || speedActual).toFixed(6)),
      used_orbital_propagation: !!usedPropagation,
      heliocentric: heliocentric,
      actual_relative: {
        r_km: relPosKM,
        v_km_s: relVelKMs
      },
      best_hypothetical: {
        impact_lat_deg: best.impactLatDeg,
        impact_lon_deg: best.impactLonDeg,
        impact_angle_deg: best.impactAngleDeg,
        azimuth_deg: best.azimuthDeg,
        impact_position_km: best.impactPosKM,
        incoming_unit_vector: best.incomingUnit,
        impact_velocity_km_s: best.impactVelocityKMps,
        start_position_km: best.startPosKM,
        start_velocity_km_s: best.startVelKMps,
        backprop_km: BACKPROP_KM,
        diameter_meters_mean: meanDiameterMeters,
        mass_kg_estimate: best.massKg,
        kinetic_energy_joules: best.KEJ,
        kinetic_energy_megatons_tnt: best.KEJ ? (best.KEJ / 4.184e15) : null
      },
      matching: {
        angular_mismatch_deg: Number(angMismatch.toFixed(4)),
        speed_difference_percent: Number((speedDiffPct * 100).toFixed(3)),
        likelihood_percent: Number(likelihoodPct.toFixed(2)),
        conservative_upper_bound_percent: conservativeUpperBoundPct
      }
    });
  }

  // helper: deterministic-ish string hash
  function hashString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  return output;
}
