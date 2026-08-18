import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/session";
import { getBonuses, getMonthlyRecords, getOrCreateSettings, getOvertimeEntries } from "@/lib/data";
import { annualSummary, currentFiscalYear, fiscalYearLabel } from "@/lib/business/salary";
import { todayYMD } from "@/lib/business/dates";
import { buildAnnualCsv } from "@/lib/export/csv";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return new Response("認証が必要です", { status: 401 });
  }

  const settings = await getOrCreateSettings(userId);
  const today = todayYMD();

  const fyParam = request.nextUrl.searchParams.get("fy");
  const parsedFy = fyParam ? Number(fyParam) : NaN;
  const fiscalYear = Number.isInteger(parsedFy) ? parsedFy : currentFiscalYear(settings.fiscalStartMonth, today);

  const [monthlyRecords, overtimeEntries, bonuses] = await Promise.all([
    getMonthlyRecords(userId),
    getOvertimeEntries(userId),
    getBonuses(userId),
  ]);

  const summary = annualSummary(
    settings,
    monthlyRecords,
    overtimeEntries,
    bonuses,
    settings.fiscalStartMonth,
    fiscalYear
  );
  const csv = buildAnnualCsv(summary, bonuses);
  const label = fiscalYearLabel(settings.fiscalStartMonth, fiscalYear);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="nenshu_${fiscalYear}.csv"; ` +
        `filename*=UTF-8''${encodeURIComponent(`年収サマリー_${label}.csv`)}`,
      "Cache-Control": "no-store",
    },
  });
}
