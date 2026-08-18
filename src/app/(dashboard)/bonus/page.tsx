import { requireUserId } from "@/lib/session";
import { getBonuses } from "@/lib/data";
import { todayYMD } from "@/lib/business/dates";
import { BonusManager } from "@/components/bonus/BonusManager";

export default async function BonusPage() {
  const userId = await requireUserId();
  const bonuses = await getBonuses(userId);
  const today = todayYMD();

  const thisYearTotal = bonuses.filter((b) => b.date.startsWith(`${today.y}-`)).reduce((s, b) => s + b.amount, 0);
  const lifetimeTotal = bonuses.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="flex flex-col">
      <BonusManager
        bonuses={bonuses}
        thisYearTotal={thisYearTotal}
        lifetimeTotal={lifetimeTotal}
        thisYearLabel={`${today.y}年`}
      />
    </div>
  );
}
