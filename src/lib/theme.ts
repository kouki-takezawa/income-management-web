// globals.css の CSS カスタムプロパティと同じ値を JS 側でも使えるようにする
// （インライン style や recharts の色指定など、Tailwind クラスでは表現しにくい箇所用）。
export const THEME = {
  primary: "#F0A9A0",
  primaryDark: "#D9847A",
  primaryLight: "#FDEAE6",
  accent: "#8FCFBB",
  amber: "#F6CD79",
  pink: "#C9AEE0",
  success: "#93C77E",
  warning: "#F0B15E",
  danger: "#E38F86",
  bg: "#FFF7EE",
  card: "#FFFFFF",
  sidebar: "#FDEDE4",
  sidebar2: "#FADFD1",
  textPrimary: "#5B4A42",
  textSecondary: "#9C8B80",
  textMuted: "#C7B8AC",
  border: "#F3E2D6",
} as const;

export const CATEGORY_COLORS = {
  base: THEME.primaryDark,
  allowance: THEME.amber,
  overtime: THEME.accent,
  bonus: THEME.pink,
} as const;
