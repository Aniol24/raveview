import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { RatingStars } from "@/components/rating-stars"
import { MapPin, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface SetCardProps {
  id: string
  djName: string
  eventName: string
  venue: string
  date: string
  rating: number
  imageUrl: string
  reviewCount: number
  className?: string
}

export function SetCard({
  id,
  djName,
  eventName,
  venue,
  date,
  rating,
  imageUrl,
  reviewCount,
  className,
}: SetCardProps) {
  return (
    <Link href={`/set/${id}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
          className,
        )}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={`${djName} - ${eventName}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-balance leading-tight">{djName}</h3>
          </div>
        </div>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground text-pretty">{eventName}</p>
          <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{date}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <RatingStars rating={rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
