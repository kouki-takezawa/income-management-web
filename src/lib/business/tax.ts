// 手取り概算（簡易計算。控除条件は考慮しない粗い概算値）
// Python版 app_state.py の social_insurance_breakdown / estimate_net_income を移植
import {
  EMPLOYMENT_INSURANCE_EMPLOYEE_RATE,
  NURSING_CARE_RATE_TOTAL,
  PENSION_ANNUAL_CAP,
  PENSION_EMPLOYEE_RATE,
  PREFECTURE_HEALTH_RATES,
} from "./constants";

export interface SocialInsuranceBreakdown {
  total: number;
  health: number;
  pension: number;
  employment: number;
}

export function socialInsuranceBreakdown(
  grossAnnual: number,
  age: number,
  prefecture: string
): SocialInsuranceBreakdown {
  const healthRateTotal = PREFECTURE_HEALTH_RATES[prefecture] ?? 10.0;
  const nursingRateTotal = age >= 40 ? NURSING_CARE_RATE_TOTAL : 0;
  const healthEmployeePct = (healthRateTotal + nursingRateTotal) / 2;

  const pensionBase = Math.min(grossAnnual, PENSION_ANNUAL_CAP);

  const health = (grossAnnual * healthEmployeePct) / 100;
  const pension = (pensionBase * PENSION_EMPLOYEE_RATE) / 100;
  const employment = (grossAnnual * EMPLOYMENT_INSURANCE_EMPLOYEE_RATE) / 100;

  return { total: health + pension + employment, health, pension, employment };
}

export function employmentIncomeDeduction(income: number): number {
  if (income <= 1_625_000) return 550_000;
  if (income <= 1_800_000) return income * 0.4 - 100_000;
  if (income <= 3_600_000) return income * 0.3 + 80_000;
  if (income <= 6_600_000) return income * 0.2 + 440_000;
  if (income <= 8_500_000) return income * 0.1 + 1_100_000;
  return 1_950_000;
}

export const INCOME_TAX_BRACKETS: [number, number, number][] = [
  [1_950_000, 0.05, 0],
  [3_300_000, 0.1, 97_500],
  [6_950_000, 0.2, 427_500],
  [9_000_000, 0.23, 636_000],
  [18_000_000, 0.33, 1_536_000],
  [40_000_000, 0.4, 2_796_000],
  [Infinity, 0.45, 4_796_000],
];

export function progressiveIncomeTax(taxable: number): number {
  if (taxable <= 0) return 0;
  for (const [upper, rate, deduction] of INCOME_TAX_BRACKETS) {
    if (taxable <= upper) {
      return Math.max(0, taxable * rate - deduction);
    }
  }
  return 0;
}

/** taxable（課税所得・国税ベース）が属する累進課税ブラケットの限界税率（rate）を返す。 */
export function marginalIncomeTaxRate(taxable: number): number {
  if (taxable <= 0) return 0;
  for (const [upper, rate] of INCOME_TAX_BRACKETS) {
    if (taxable <= upper) return rate;
  }
  return INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1][1];
}

export interface FurusatoEstimate {
  limit: number;
  taxableResident: number;
  incomeTaxRate: number;
}

/**
 * ふるさと納税の実質負担2,000円で収まる寄付額の目安上限を概算する。
 * 独身・扶養なしという単純化した前提（既存の手取り概算と同じ前提）。
 * iDeCo・医療費控除・扶養控除など、ここで考慮していない他の控除は加味しない。
 */
export function estimateFurusatoLimit(annualGross: number, age: number, prefecture: string): FurusatoEstimate {
  if (annualGross <= 0) {
    return { limit: 0, taxableResident: 0, incomeTaxRate: 0 };
  }

  const { total: socialInsurance } = socialInsuranceBreakdown(annualGross, age, prefecture);
  const deduction = employmentIncomeDeduction(annualGross);
  const taxableNational = Math.max(0, annualGross - deduction - socialInsurance - 480_000);
  const taxableResident = Math.max(0, annualGross - deduction - socialInsurance - 430_000);

  if (taxableResident <= 0) {
    return { limit: 0, taxableResident: 0, incomeTaxRate: 0 };
  }

  const incomeTaxRate = marginalIncomeTaxRate(taxableNational);
  const residentIncomeBasedPortion = taxableResident * 0.1; // 住民税所得割のみ（均等割5,000円は含めない）
  const limit = (residentIncomeBasedPortion * 0.2) / (0.9 - incomeTaxRate * 1.021) + 2_000;

  return { limit, taxableResident, incomeTaxRate };
}

export interface NetIncomeEstimate {
  gross: number;
  socialInsurance: number;
  socialInsuranceBreakdown: { health: number; pension: number; employment: number };
  incomeTax: number;
  residentTax: number;
  net: number;
}

/**
 * periodGross: 対象期間（月次なら1か月分）の総支給額。
 * months: 年換算する際の倍率（月次概算なら12、年間概算なら1）。
 * 社会保険料・所得税・住民税は年間ベースで計算し、対象期間分を按分して返す。
 */
export function estimateNetIncome(
  periodGross: number,
  age: number,
  prefecture: string,
  months = 1
): NetIncomeEstimate {
  const annualEquiv = periodGross * months;
  const { total: socialInsurance, health, pension, employment } = socialInsuranceBreakdown(
    annualEquiv,
    age,
    prefecture
  );
  const deduction = employmentIncomeDeduction(annualEquiv);
  const taxableNational = Math.max(0, annualEquiv - deduction - socialInsurance - 480_000);
  const incomeTax = progressiveIncomeTax(taxableNational) * 1.021; // 復興特別所得税込み
  const taxableResident = Math.max(0, annualEquiv - deduction - socialInsurance - 430_000);
  const residentTax = taxableResident > 0 ? taxableResident * 0.1 + 5_000 : 0;

  const periodSocialInsurance = socialInsurance / months;
  const periodIncomeTax = incomeTax / months;
  const periodResidentTax = residentTax / months;

  return {
    gross: periodGross,
    socialInsurance: periodSocialInsurance,
    socialInsuranceBreakdown: {
      health: health / months,
      pension: pension / months,
      employment: employment / months,
    },
    incomeTax: periodIncomeTax,
    residentTax: periodResidentTax,
    net: periodGross - periodSocialInsurance - periodIncomeTax - periodResidentTax,
  };
}
