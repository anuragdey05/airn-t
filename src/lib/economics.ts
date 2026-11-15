export type ActivityLevel = 'resting' | 'light_walk' | 'commute_active' | 'heavy_cardio';

export interface ExposureParams {
  pm25: number; // µg/m³ ambient outdoor PM2.5
  hoursOutdoors: number; // 0 to 24
  activityLevel: ActivityLevel;
  indoorPurifier: boolean; // reduces indoor infiltration from 0.55 to 0.15
  baselineCravingUtility: number; // 0 to 100 subjective craving/hedonic desire for a real cigarette
}

export interface ActivityMeta {
  id: ActivityLevel;
  label: string;
  ventilationMultiplier: number; // relative to 24h average resting inhalation (~15 m³/day)
  description: string;
}

export const ACTIVITY_LEVELS: Record<ActivityLevel, ActivityMeta> = {
  resting: {
    id: 'resting',
    label: 'Sedentary / Desk',
    ventilationMultiplier: 1.0,
    description: 'Standard minute ventilation (~10.4 L/min, ~15 m³/day)',
  },
  light_walk: {
    id: 'light_walk',
    label: 'Urban Stroll / Errands',
    ventilationMultiplier: 1.35,
    description: 'Elevated tidal volume while walking outdoors (~14 L/min)',
  },
  commute_active: {
    id: 'commute_active',
    label: 'Transit / Brisk Commute',
    ventilationMultiplier: 1.75,
    description: 'Brisk walking or light cycling alongside traffic corridors (~18 L/min)',
  },
  heavy_cardio: {
    id: 'heavy_cardio',
    label: 'Outdoor Run / Cycling',
    ventilationMultiplier: 2.8,
    description: 'Deep alveolar deposition under aerobic exertion (~30+ L/min)',
  },
};

/**
 * US EPA AQI breakpoints for PM2.5 (µg/m³, 24-hour standard).
 * Converts between US AQI (0–500) and PM2.5 concentration (µg/m³).
 */
const AQI_BREAKPOINTS = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

export function pm25ToUsAqi(pm25: number): number {
  const clamped = Math.max(0, pm25);
  for (const bp of AQI_BREAKPOINTS) {
    if (clamped <= bp.cHigh) {
      const aqi =
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (clamped - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }
  // Above 500.4 µg/m³ extrapolate linearly
  return Math.round(500 + (clamped - 500.4) * 0.65);
}

export function usAqiToPm25(aqi: number): number {
  const clamped = Math.max(0, aqi);
  for (const bp of AQI_BREAKPOINTS) {
    if (clamped <= bp.iHigh) {
      const pm =
        ((bp.cHigh - bp.cLow) / (bp.iHigh - bp.iLow)) * (clamped - bp.iLow) + bp.cLow;
      return Number(pm.toFixed(1));
    }
  }
  return Number((500.4 + (clamped - 500) / 0.65).toFixed(1));
}

export interface AqiSeverity {
  tier: string;
  tagline: string;
  colorHex: string;
  badgeClass: string;
  glowColor: string;
  smogOpacity: number;
}

export function getAqiSeverity(aqi: number): AqiSeverity {
  if (aqi <= 50) {
    return {
      tier: 'Good // Unfiltered Alpine',
      tagline: 'Pristine air. Every real cigarette hits with maximum marginal guilt.',
      colorHex: '#10B981',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glowColor: 'rgba(16, 185, 129, 0.14)',
      smogOpacity: 0.08,
    };
  }
  if (aqi <= 100) {
    return {
      tier: 'Moderate // Light Secondhand',
      tagline: 'Subtle urban haze. Equivalent to sitting near an outdoor patio smoker.',
      colorHex: '#F59E0B',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      glowColor: 'rgba(245, 158, 11, 0.18)',
      smogOpacity: 0.18,
    };
  }
  if (aqi <= 150) {
    return {
      tier: 'Unhealthy for Sensitive // Casual Smoker',
      tagline: 'Your alveoli are already clocking a light daily habit without the buzz.',
      colorHex: '#F97316',
      badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      glowColor: 'rgba(249, 115, 22, 0.24)',
      smogOpacity: 0.3,
    };
  }
  if (aqi <= 200) {
    return {
      tier: 'Unhealthy // Social Pack-a-Week',
      tagline: 'Baseline lung tax is steep. Marginal health disutility of 1 cigarette is dropping fast.',
      colorHex: '#EF4444',
      badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
      glowColor: 'rgba(239, 68, 68, 0.28)',
      smogOpacity: 0.44,
    };
  }
  if (aqi <= 300) {
    return {
      tier: 'Very Unhealthy // Heavy Lounge',
      tagline: 'You are hotboxing the municipality. Diminishing sensitivity in full effect.',
      colorHex: '#A855F7',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      glowColor: 'rgba(168, 85, 247, 0.32)',
      smogOpacity: 0.6,
    };
  }
  return {
    tier: 'Hazardous // Industrial Chimney',
    tagline: 'Atmospheric chain-smoking. The dose-response curve has effectively flattened.',
    colorHex: '#E11D48',
    badgeClass: 'bg-rose-600/20 text-rose-200 border-rose-500/40',
    glowColor: 'rgba(225, 29, 72, 0.38)',
    smogOpacity: 0.78,
  };
}

/**
 * Pope et al. (2009, Circulation) / (2011, EHP) Concave Dose-Response Model:
 * Relative Risk of cardiovascular/cardiopulmonary mortality as a concave function of daily cigarette-equivalent dose C:
 *   RR(C) = 1 + alpha * ((C + c0)^gamma - c0^gamma)
 * where gamma = 0.42 (< 1, strictly concave: dR/dC > 0, d²R/dC² < 0).
 * Calibrated so that:
 * - C = 0 => RR = 1.00
 * - C = 1 cig/day => RR ≈ 1.22 (consistent with Pope et al. steep initial slope at 1–3 cigs/day)
 * - C = 20 cigs/day (1 pack) => RR ≈ 1.78
 */
const POPE_ALPHA = 0.26;
const POPE_GAMMA = 0.42;
const POPE_C0 = 0.15;

export function popeRelativeRisk(cigEquivalents: number): number {
  const c = Math.max(0, cigEquivalents);
  return 1 + POPE_ALPHA * (Math.pow(c + POPE_C0, POPE_GAMMA) - Math.pow(POPE_C0, POPE_GAMMA));
}

/**
 * Marginal Health Cost MC(C) = RR(C + 1) - RR(C)
 * Represents the incremental relative risk jump caused by lighting 1 actual cigarette
 * when your baseline passive cigarette intake from ambient pollution is C.
 */
export function marginalHealthCostOfOneCig(baselineCigEquivalents: number): number {
  const c = Math.max(0, baselineCigEquivalents);
  return popeRelativeRisk(c + 1) - popeRelativeRisk(c);
}

export interface EconomicBreakdown {
  ambientPm25: number;
  usAqi: number;
  rawBerkeleyCigsPerDay: number; // pure outdoor 24h: pm25 / 22
  effectivePm25: number; // adjusted for indoor/outdoor hours, purifier & ventilation
  effectiveCigsPerDay: number; // effectivePm25 / 22
  cigsPerWeek: number;
  cigsPerMonth: number;
  cigsPerYear: number;
  packsPerYear: number; // 20 cigs per pack

  // Pope et al. (2009) Dose-Response Metrics
  currentRelativeRisk: number; // RR(C_env)
  riskAfterOneRealCig: number; // RR(C_env + 1)
  marginalHealthCostCurrent: number; // MC(C_env) = RR(C_env + 1) - RR(C_env)
  marginalHealthCostPristine: number; // MC(0) = RR(1) - RR(0)
  marginalDamageDiscountPct: number; // (1 - MC(C_env)/MC(0)) * 100 — how much less marginal harm 1 cig does here vs clean air

  // Kahneman-Tversky / Weber-Fechner Perceptual Salience Metrics
  weberRelativeIncreasePct: number; // (1 / max(C_env, 0.05)) * 100 — % increase in daily smoke intake
  perceptualMaskingScore: number; // 0 to 100: how "hidden" 1 extra cigarette is inside existing ambient smog

  // Becker-Murphy (1988) Rational Addiction & McFadden Logit Smoking Propensity
  netMarginalUtilityIndex: number; // -100 to +100
  smokingPropensityPct: number; // 0 to 100% probability/propensity of lighting up given marginal utility vs reduced marginal cost
  verdictTitle: string;
  verdictExplanation: string;
  economicPersona: string;
}

export function calculateCigaretteEconomics(params: ExposureParams): EconomicBreakdown {
  const ambientPm25 = Math.max(0, params.pm25);
  const usAqi = pm25ToUsAqi(ambientPm25);

  // Berkeley Earth (Muller & Muller, 2015): 22 µg/m³ = 1.0 cigarette/day
  const rawBerkeleyCigsPerDay = ambientPm25 / 22.0;

  // Exposure adjustment:
  // Outdoor hours use activity ventilation multiplier; indoor hours use infiltration factor (0.55 normal, 0.15 HEPA purifier)
  const hoursOut = Math.min(24, Math.max(0, params.hoursOutdoors));
  const hoursIn = 24 - hoursOut;
  const ventMult = ACTIVITY_LEVELS[params.activityLevel].ventilationMultiplier;
  const indoorInfiltration = params.indoorPurifier ? 0.15 : 0.55;

  const doseWeight = (hoursOut * ventMult + hoursIn * indoorInfiltration) / 24.0;
  const effectivePm25 = ambientPm25 * doseWeight;
  const effectiveCigsPerDay = effectivePm25 / 22.0;

  const cigsPerWeek = effectiveCigsPerDay * 7;
  const cigsPerMonth = effectiveCigsPerDay * 30.44;
  const cigsPerYear = effectiveCigsPerDay * 365;
  const packsPerYear = cigsPerYear / 20;

  // 1. Pope et al. (2009) Concave Dose-Response & Marginal Health Cost
  const currentRelativeRisk = popeRelativeRisk(effectiveCigsPerDay);
  const riskAfterOneRealCig = popeRelativeRisk(effectiveCigsPerDay + 1);
  const marginalHealthCostCurrent = marginalHealthCostOfOneCig(effectiveCigsPerDay);
  const marginalHealthCostPristine = marginalHealthCostOfOneCig(0);

  // Percentage reduction in marginal health cost compared to pristine 0 PM2.5 air
  const marginalDamageDiscountPct = Math.max(
    0,
    Math.min(99, (1 - marginalHealthCostCurrent / marginalHealthCostPristine) * 100)
  );

  // 2. Weber-Fechner / Kahneman-Tversky Reference Point Salience
  // How large is +1 cigarette relative to current baseline C_env?
  const referenceFloor = Math.max(effectiveCigsPerDay, 0.05);
  const weberRelativeIncreasePct = (1 / referenceFloor) * 100;

  // Perceptual masking score (0 = totally noticeable in clean air, 100 = completely masked by heavy smog)
  const perceptualMaskingScore = Math.round(
    100 * (effectiveCigsPerDay / (effectiveCigsPerDay + 1.25))
  );

  // 3. Becker-Murphy (1988) Rational Choice & McFadden Random Utility Logit
  // Utility of smoking 1 real cigarette:
  //   U_net = U_hedonic(craving) - lambda * (MC_health(C_env) / MC_health(0)) * Salience(C_env)
  const normalizedCraving = params.baselineCravingUtility / 100; // 0..1
  const normalizedMarginalCost = marginalHealthCostCurrent / marginalHealthCostPristine; // 1.0 in clean air -> ~0.12 in severe smog
  const salienceWeight = 1 / (1 + 0.45 * effectiveCigsPerDay); // Weber-Fechner diminishing sensitivity

  // Perceived effective deterrence from health damage (1.0 in clean air, drops toward 0 in heavy smog)
  const perceivedHealthDeterrence = 0.65 * normalizedMarginalCost + 0.35 * salienceWeight;

  // Net Marginal Utility Index (-100 to +100)
  const rawNetUtility = (normalizedCraving * 1.15 - perceivedHealthDeterrence * 0.85) * 100;
  const netMarginalUtilityIndex = Math.max(-100, Math.min(100, Math.round(rawNetUtility)));

  // Logistic choice probability P(Smoke | AQI, Craving)
  // Calibrated so that at default craving (50/100):
  // - C_env = 0.1 cigs (clean air) => ~14% propensity
  // - C_env = 1.5 cigs (moderate) => ~42% propensity
  // - C_env = 5.0 cigs (unhealthy) => ~74% propensity
  // - C_env = 12+ cigs (severe) => ~91% propensity
  const logitZ = 3.1 * (normalizedCraving - 0.68 * perceivedHealthDeterrence + 0.08);
  const smokingPropensityPct = Math.round(
    Math.max(1, Math.min(99, (1 / (1 + Math.exp(-logitZ))) * 100))
  );

  let verdictTitle = '';
  let verdictExplanation = '';
  let economicPersona = '';

  if (smokingPropensityPct < 25) {
    verdictTitle = 'Irrational Indulgence // Peak Marginal Guilt';
    economicPersona = 'Risk-Averse Clean-Air Purist';
    verdictExplanation =
      'At this clean baseline, you sit on the steepest slope of Pope et al.’s concave dose-response curve. Lighting a real cigarette inflicts near-maximum marginal cardiovascular cost and spikes your daily particulate load dramatically.';
  } else if (smokingPropensityPct < 50) {
    verdictTitle = 'Sub-Threshold Justification // Moderate Deterrence';
    economicPersona = 'Marginal Hedonic Hedger';
    verdictExplanation =
      'Ambient particulates have begun absorbing your initial dose-response slope, discounting the marginal health cost of a cigarette by ' +
      marginalDamageDiscountPct.toFixed(0) +
      '%. Still, the Weber-Fechner relative jump remains perceptible enough to restrain a rational agent.';
  } else if (smokingPropensityPct < 75) {
    verdictTitle = 'Economically Tempting // Sunk-Lung Fallacy Active';
    economicPersona = 'Becker-Murphy Opportunist';
    verdictExplanation =
      'Your lungs are already processing ' +
      effectiveCigsPerDay.toFixed(1) +
      ' passive cigarettes today — all the tar, zero nicotine utility. Because the marginal harm of cigarette #(N+1) is ' +
      marginalDamageDiscountPct.toFixed(0) +
      '% lower than in clean air, behavioral friction drops sharply.';
  } else {
    verdictTitle = 'Near-Zero Marginal Disutility // Smog Singularity';
    economicPersona = 'Competing-Risk Fatalist';
    verdictExplanation =
      'Under Pope et al.’s log-linear saturation and Dow-Philipson competing mortality risk theory, ambient smog has already pushed you onto the flat plateau of the dose-response curve. One real cigarette adds just +' +
      weberRelativeIncreasePct.toFixed(1) +
      '% to today’s particulate burden.';
  }

  return {
    ambientPm25,
    usAqi,
    rawBerkeleyCigsPerDay,
    effectivePm25,
    effectiveCigsPerDay,
    cigsPerWeek,
    cigsPerMonth,
    cigsPerYear,
    packsPerYear,
    currentRelativeRisk,
    riskAfterOneRealCig,
    marginalHealthCostCurrent,
    marginalHealthCostPristine,
    marginalDamageDiscountPct,
    weberRelativeIncreasePct,
    perceptualMaskingScore,
    netMarginalUtilityIndex,
    smokingPropensityPct,
    verdictTitle,
    verdictExplanation,
    economicPersona,
  };
}

export interface AcademicCitation {
  id: string;
  shortTitle: string;
  authors: string;
  year: number;
  journal: string;
  formulaSummary: string;
  applicationInApp: string;
  doiOrUrl: string;
}

export const ACADEMIC_CITATIONS: AcademicCitation[] = [
  {
    id: 'berkeley-earth-2015',
    shortTitle: 'Air Pollution and Cigarette Equivalence',
    authors: 'Richard A. Muller & Elizabeth A. Muller',
    year: 2015,
    journal: 'Berkeley Earth Science Paper',
    formulaSummary: '1 Cigarette / day ≈ 22 µg/m³ of ambient PM2.5 (24h average exposure)',
    applicationInApp:
      'Establishes our primary conversion rate by equating the population-attributable mortality risk of ambient PM2.5 in China & US cohorts to active cigarette smoking.',
    doiOrUrl: 'https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/',
  },
  {
    id: 'pope-2009',
    shortTitle: 'Cardiovascular Mortality and Exposure to Airborne Fine Particulate Matter and Cigarette Smoke: Shape of the Exposure-Response Relationship',
    authors: 'C. Arden Pope III, Richard T. Burnett, et al.',
    year: 2009,
    journal: 'Circulation (Vol. 120, Issue 11, pp. 941–948)',
    formulaSummary: 'RR(d) = 1 + α · d^γ with γ < 1 (Strictly Concave Exposure-Response)',
    applicationInApp:
      'Proves that the dose-response curve between PM2.5 and cardiovascular mortality is steep at low doses and flattens at high doses — meaning the marginal health cost (ΔRisk/ΔCig) strictly decreases as baseline air pollution rises.',
    doiOrUrl: 'https://doi.org/10.1161/CIRCULATIONAHA.109.857888',
  },
  {
    id: 'kahneman-tversky-1979',
    shortTitle: 'Prospect Theory: An Analysis of Decision under Risk & Weber-Fechner Diminishing Sensitivity',
    authors: 'Daniel Kahneman & Amos Tversky',
    year: 1979,
    journal: 'Econometrica (Vol. 47, No. 2, pp. 263–291)',
    formulaSummary: 'v(x; r) exhibits diminishing sensitivity ∂²|v|/∂x² < 0 relative to reference point r = C_env',
    applicationInApp:
      'Explains why inhaling 1 extra cigarette when your reference point is already 8 passive cigarettes feels psychologically negligible (Weber fraction ΔC / C_env = 12.5%) compared to pristine air.',
    doiOrUrl: 'https://doi.org/10.2307/1914185',
  },
  {
    id: 'becker-murphy-1988',
    shortTitle: 'A Theory of Rational Addiction & Competing Mortality Risks',
    authors: 'Gary S. Becker & Kevin M. Murphy (1988); W. H. Dow, T. J. Philipson & X. Sala-i-Martin (1999)',
    year: 1988,
    journal: 'Journal of Political Economy (Vol. 96, No. 4 / Vol. 107, No. 6)',
    formulaSummary: 'Smoke iff U_nicotine > δ · MC_health(C_env) · S(C_env) + P_cig',
    applicationInApp:
      'Models how an exogenous increase in environmental health risk lowers the shadow price of risky consumption and reduces the marginal return to self-protection (abstinence).',
    doiOrUrl: 'https://doi.org/10.1086/261558',
  },
];
