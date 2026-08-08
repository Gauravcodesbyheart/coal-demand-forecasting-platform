/**
 * CoalSense AI - Forecasting Engine
 *
 * Implements multiple forecasting models in TypeScript:
 * 1. Linear Regression (baseline)
 * 2. Moving Average
 * 3. Exponential Smoothing
 * 4. Weighted Ensemble (combines all models)
 *
 * Each model produces predictions with confidence intervals.
 */

export interface DataPoint {
  date: string; // YYYY-MM format
  value: number;
}

export interface ForecastResult {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
}

export interface ModelOutput {
  name: string;
  forecasts: ForecastResult[];
  metrics: ModelMetrics;
}

// ─── Helper Functions ───

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function addMonths(dateStr: string, months: number): string {
  const [y, m] = dateStr.split("-").map(Number);
  const totalMonths = (y * 12 + m - 1) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

// ─── Model 1: Linear Regression ───

function linearRegression(data: DataPoint[], horizon: number): ModelOutput {
  const n = data.length;
  const values = data.map((d) => d.value);
  const xs = values.map((_, i) => i);
  const ys = values;

  const xMean = mean(xs);
  const yMean = mean(ys);

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Calculate residuals for confidence interval
  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const residualStd = std(residuals);

  // In-sample predictions for metrics
  const inSamplePreds = xs.map((x) => slope * x + intercept);

  // Out-of-sample forecasts
  const forecasts: ForecastResult[] = [];
  const lastDate = data[data.length - 1].date;
  for (let h = 1; h <= horizon; h++) {
    const x = n - 1 + h;
    const pred = slope * x + intercept;
    forecasts.push({
      date: addMonths(lastDate, h),
      predicted: Math.max(0, Math.round(pred * 100) / 100),
      lower: Math.max(0, Math.round((pred - 1.96 * residualStd) * 100) / 100),
      upper: Math.round((pred + 1.96 * residualStd) * 100) / 100,
    });
  }

  return {
    name: "Linear Regression",
    forecasts,
    metrics: calculateMetrics(ys, inSamplePreds),
  };
}

// ─── Model 2: Moving Average ───

function movingAverage(data: DataPoint[], horizon: number, window = 3): ModelOutput {
  const values = data.map((d) => d.value);
  const n = values.length;

  // In-sample predictions
  const inSamplePreds: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i < window) {
      inSamplePreds.push(mean(values.slice(0, i + 1)));
    } else {
      inSamplePreds.push(mean(values.slice(i - window, i)));
    }
  }

  // Calculate residuals
  const residuals = values.map((v, i) => v - inSamplePreds[i]);
  const residualStd = std(residuals);

  // Out-of-sample
  const recentValues = values.slice(-window);
  const avgVal = mean(recentValues);

  const forecasts: ForecastResult[] = [];
  const lastDate = data[data.length - 1].date;
  for (let h = 1; h <= horizon; h++) {
    forecasts.push({
      date: addMonths(lastDate, h),
      predicted: Math.max(0, Math.round(avgVal * 100) / 100),
      lower: Math.max(0, Math.round((avgVal - 1.96 * residualStd) * 100) / 100),
      upper: Math.round((avgVal + 1.96 * residualStd) * 100) / 100,
    });
  }

  return {
    name: "Moving Average",
    forecasts,
    metrics: calculateMetrics(values.slice(window), inSamplePreds.slice(window)),
  };
}

// ─── Model 3: Exponential Smoothing ───

function exponentialSmoothing(data: DataPoint[], horizon: number, alpha = 0.3): ModelOutput {
  const values = data.map((d) => d.value);
  const n = values.length;

  const smoothed: number[] = [values[0]];
  for (let i = 1; i < n; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }

  const residuals = values.map((v, i) => v - smoothed[i]);
  const residualStd = std(residuals);

  const lastSmoothed = smoothed[smoothed.length - 1];

  const forecasts: ForecastResult[] = [];
  const lastDate = data[data.length - 1].date;
  for (let h = 1; h <= horizon; h++) {
    forecasts.push({
      date: addMonths(lastDate, h),
      predicted: Math.max(0, Math.round(lastSmoothed * 100) / 100),
      lower: Math.max(0, Math.round((lastSmoothed - 1.96 * residualStd) * 100) / 100),
      upper: Math.round((lastSmoothed + 1.96 * residualStd) * 100) / 100,
    });
  }

  return {
    name: "Exponential Smoothing",
    forecasts,
    metrics: calculateMetrics(values.slice(1), smoothed.slice(1)),
  };
}

// ─── Model 4: Holt's Linear Trend ───

function holtLinearTrend(data: DataPoint[], horizon: number, alpha = 0.3, beta = 0.1): ModelOutput {
  const values = data.map((d) => d.value);
  const n = values.length;

  let level = values[0];
  let trend = n > 1 ? values[1] - values[0] : 0;

  const fitted: number[] = [level];
  for (let i = 1; i < n; i++) {
    const newLevel = alpha * values[i] + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
    trend = newTrend;
    fitted.push(level + trend);
  }

  const residuals = values.map((v, i) => v - fitted[i]);
  const residualStd = std(residuals);

  const forecasts: ForecastResult[] = [];
  const lastDate = data[data.length - 1].date;
  for (let h = 1; h <= horizon; h++) {
    const pred = level + h * trend;
    forecasts.push({
      date: addMonths(lastDate, h),
      predicted: Math.max(0, Math.round(pred * 100) / 100),
      lower: Math.max(0, Math.round((pred - 1.96 * residualStd) * 100) / 100),
      upper: Math.round((pred + 1.96 * residualStd) * 100) / 100,
    });
  }

  return {
    name: "Holt's Linear Trend",
    forecasts,
    metrics: calculateMetrics(values.slice(1), fitted.slice(1)),
  };
}

// ─── Ensemble ───

export function runAllModels(data: DataPoint[], horizon: number): {
  models: ModelOutput[];
  bestModel: ModelOutput;
  ensemble: ModelOutput;
} {
  if (data.length < 4) {
    // Not enough data, return simple average
    const avgVal = mean(data.map((d) => d.value));
    const lastDate = data.length > 0 ? data[data.length - 1].date : "2024-01";
    const simpleForecasts: ForecastResult[] = [];
    for (let h = 1; h <= horizon; h++) {
      simpleForecasts.push({
        date: addMonths(lastDate, h),
        predicted: Math.round(avgVal * 100) / 100,
        lower: Math.round(avgVal * 0.8 * 100) / 100,
        upper: Math.round(avgVal * 1.2 * 100) / 100,
      });
    }
    const output: ModelOutput = {
      name: "Simple Average",
      forecasts: simpleForecasts,
      metrics: { mae: 0, rmse: 0, mape: 0 },
    };
    return { models: [output], bestModel: output, ensemble: output };
  }

  const models = [
    linearRegression(data, horizon),
    movingAverage(data, horizon),
    exponentialSmoothing(data, horizon),
    holtLinearTrend(data, horizon),
  ];

  // Find best model by MAPE (or RMSE if MAPE is 0)
  const bestModel = models.reduce((best, model) => {
    const bestScore = best.metrics.mape > 0 ? best.metrics.mape : best.metrics.rmse;
    const modelScore = model.metrics.mape > 0 ? model.metrics.mape : model.metrics.rmse;
    return modelScore < bestScore ? model : best;
  });

  // Weighted ensemble: weight inversely proportional to RMSE
  const weights = models.map((m) => {
    const rmse = m.metrics.rmse || 1;
    return 1 / rmse;
  });
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const normalizedWeights = weights.map((w) => w / totalWeight);

  const ensembleForecasts: ForecastResult[] = [];
  for (let h = 0; h < horizon; h++) {
    let pred = 0, lower = 0, upper = 0;
    for (let m = 0; m < models.length; m++) {
      pred += normalizedWeights[m] * models[m].forecasts[h].predicted;
      lower += normalizedWeights[m] * models[m].forecasts[h].lower;
      upper += normalizedWeights[m] * models[m].forecasts[h].upper;
    }
    ensembleForecasts.push({
      date: models[0].forecasts[h].date,
      predicted: Math.max(0, Math.round(pred * 100) / 100),
      lower: Math.max(0, Math.round(lower * 100) / 100),
      upper: Math.round(upper * 100) / 100,
    });
  }

  const ensemble: ModelOutput = {
    name: "Weighted Ensemble",
    forecasts: ensembleForecasts,
    metrics: {
      mae: Math.round(mean(models.map((m) => m.metrics.mae)) * 100) / 100,
      rmse: Math.round(mean(models.map((m) => m.metrics.rmse)) * 100) / 100,
      mape: Math.round(mean(models.map((m) => m.metrics.mape)) * 100) / 100,
    },
  };

  return { models, bestModel, ensemble };
}

// ─── Metrics ───

function calculateMetrics(actual: number[], predicted: number[]): ModelMetrics {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return { mae: 0, rmse: 0, mape: 0 };

  let sumAE = 0, sumSE = 0, sumAPE = 0;
  let mapeCount = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    sumAE += Math.abs(error);
    sumSE += error ** 2;
    if (actual[i] !== 0) {
      sumAPE += Math.abs(error / actual[i]);
      mapeCount++;
    }
  }

  return {
    mae: Math.round((sumAE / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(sumSE / n) * 100) / 100,
    mape: mapeCount > 0 ? Math.round((sumAPE / mapeCount) * 100 * 100) / 100 : 0,
  };
}

// ─── What-If Analysis ───

export interface WhatIfParams {
  demandGrowthPercent: number;
  productionCapacity: number; // MT
  currentInventory: number; // MT
  safetyStock: number; // MT
  baselineDemand: number; // MT (from latest forecast)
}

export interface WhatIfResult {
  expectedDemand: number;
  requiredSupply: number;
  availableSupply: number;
  gap: number;
  gapPercent: number;
  status: "surplus" | "balanced" | "deficit";
  recommendation: string;
}

export function runWhatIfAnalysis(params: WhatIfParams): WhatIfResult {
  const expectedDemand = params.baselineDemand * (1 + params.demandGrowthPercent / 100);
  const requiredSupply = expectedDemand + params.safetyStock;
  const availableSupply = params.currentInventory + params.productionCapacity;
  const gap = availableSupply - requiredSupply;
  const gapPercent = requiredSupply > 0 ? (gap / requiredSupply) * 100 : 0;

  let status: WhatIfResult["status"];
  let recommendation: string;

  if (gap > requiredSupply * 0.05) {
    status = "surplus";
    recommendation = `Expected surplus of ${Math.abs(gap).toFixed(2)} MT. Consider optimizing production schedules to reduce operational costs, or explore additional dispatch opportunities.`;
  } else if (gap < -requiredSupply * 0.02) {
    status = "deficit";
    recommendation = `Potential supply gap of ${Math.abs(gap).toFixed(2)} MT detected. Recommend increasing production targets, activating additional shifts, or reviewing dispatch priorities to ensure demand fulfillment.`;
  } else {
    status = "balanced";
    recommendation = `Supply and demand are approximately balanced. Continue monitoring closely and maintain current production plans. Build strategic reserves if possible.`;
  }

  return {
    expectedDemand: Math.round(expectedDemand * 100) / 100,
    requiredSupply: Math.round(requiredSupply * 100) / 100,
    availableSupply: Math.round(availableSupply * 100) / 100,
    gap: Math.round(gap * 100) / 100,
    gapPercent: Math.round(gapPercent * 100) / 100,
    status,
    recommendation,
  };
}
