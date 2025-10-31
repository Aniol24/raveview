import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  className?: string
}

export function RatingStars({ rating, maxRating = 10, size = "md", showNumber = true, className }: RatingStarsProps) {
  const stars = 5
  const normalizedRating = (rating / maxRating) * stars

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: stars }).map((_, i) => {
          const fillPercentage = Math.min(Math.max(normalizedRating - i, 0), 1)

          return (
            <div key={i} className="relative">
              <Star className={cn(sizeClasses[size], "text-muted")} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                <Star className={cn(sizeClasses[size], "fill-primary text-primary")} />
              </div>
            </div>
          )
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  )
}
