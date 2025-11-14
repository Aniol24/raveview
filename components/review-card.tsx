import { Card, CardContent } from "@/components/ui/card"
import { RatingStars } from "@/components/rating-stars"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface ReviewCardProps {
  userName: string
  rating: number
  comment: string
  date: string
  wasPresent?: boolean
  avatarUrl?: string | null
}

export function ReviewCard({
  userName,
  rating,
  comment,
  date,
  wasPresent = false,
  avatarUrl
}: ReviewCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>

          <RatingStars rating={rating} size="sm" showNumber={false} />
        </div>

        {wasPresent && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Badge
              variant="secondary"
              className="mb-3 flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium tracking-wide">Yo estuve allí</span>
            </Badge>
          </motion.div>
        )}

        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {comment}
        </p>
      </CardContent>
    </Card>
  )
}
