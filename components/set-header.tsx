import { Badge } from "@/components/ui/badge";

export function SetHeader({
  title,
  channelOrArtist,
  tags,
  durationSeconds,
}: {
  title: string;
  channelOrArtist: string;
  tags: string[];
  durationSeconds?: number;
}) {
  const dur =
    typeof durationSeconds === "number"
      ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
      : undefined;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
      <div className="text-sm text-muted-foreground">
        {channelOrArtist}
        {dur ? ` • ${dur}` : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}
