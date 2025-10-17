import { Separator } from "@/components/ui/separator";

export function StatsBar({
  avgRating,
  reviewCount,
  wasThereCount,
}: {
  avgRating: number;
  reviewCount: number;
  wasThereCount: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>⭐ {avgRating.toFixed(1)} avg</span>
      <Separator orientation="vertical" className="h-4" />
      <span>{reviewCount} reviews</span>
      <Separator orientation="vertical" className="h-4" />
      <span>🎟️ {wasThereCount} “I was there”</span>
    </div>
  );
}
