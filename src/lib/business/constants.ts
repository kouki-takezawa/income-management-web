// 協会けんぽ 令和7年度（2025年度）都道府県毎の健康保険料率（労使合計・%）
// 出典: 全国健康保険協会 https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r07/index.html
export const PREFECTURE_HEALTH_RATES: Record<string, number> = {
  北海道: 10.31, 青森県: 9.85, 岩手県: 9.62, 宮城県: 10.11, 秋田県: 10.01,
  山形県: 9.75, 福島県: 9.62, 茨城県: 9.67, 栃木県: 9.82, 群馬県: 9.77,
  埼玉県: 9.76, 千葉県: 9.79, 東京都: 9.91, 神奈川県: 9.92, 新潟県: 9.55,
  富山県: 9.65, 石川県: 9.88, 福井県: 9.94, 山梨県: 9.89, 長野県: 9.69,
  岐阜県: 9.93, 静岡県: 9.80, 愛知県: 10.03, 三重県: 9.99, 滋賀県: 9.97,
  京都府: 10.03, 大阪府: 10.24, 兵庫県: 10.16, 奈良県: 10.02, 和歌山県: 10.19,
  鳥取県: 9.93, 島根県: 9.94, 岡山県: 10.17, 広島県: 9.97, 山口県: 10.36,
  徳島県: 10.47, 香川県: 10.21, 愛媛県: 10.18, 高知県: 10.13, 福岡県: 10.31,
  佐賀県: 10.78, 長崎県: 10.41, 熊本県: 10.12, 大分県: 10.25, 宮崎県: 10.09,
  鹿児島県: 10.31, 沖縄県: 9.44,
};

export const PREFECTURES = Object.keys(PREFECTURE_HEALTH_RATES);

export const NURSING_CARE_RATE_TOTAL = 1.59;
export const PENSION_EMPLOYEE_RATE = 9.15;
export const PENSION_ANNUAL_CAP = 7_800_000;
export const EMPLOYMENT_INSURANCE_EMPLOYEE_RATE = 0.55;
export const RATE_FISCAL_YEAR_LABEL = "協会けんぽ 令和7年度（2025年度）都道府県別保険料率";

export const MONTH_NAMES_JP = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];
export const WEEKDAY_NAMES_JP = ["日", "月", "火", "水", "木", "金", "土"];

export const OVERTIME_CATEGORIES = ["weekday", "late_night", "holiday", "holiday_late_night"] as const;
export type OvertimeCategory = (typeof OVERTIME_CATEGORIES)[number];

export const OVERTIME_CATEGORY_LABELS: Record<OvertimeCategory, string> = {
  weekday: "平日残業",
  late_night: "深夜残業",
  holiday: "休日出勤",
  holiday_late_night: "休日深夜",
};

export const LEAVE_TYPES = {
  full: { label: "全休", short: "全休", days: 1 },
  half_am: { label: "午前半休", short: "午前", days: 0.5 },
  half_pm: { label: "午後半休", short: "午後", days: 0.5 },
} as const;

export type LeaveType = keyof typeof LEAVE_TYPES;

export function leaveTypeDays(type: string): number {
  return (LEAVE_TYPES as Record<string, { days: number }>)[type]?.days ?? LEAVE_TYPES.full.days;
}
