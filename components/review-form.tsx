"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Star, MapPin, Sparkles } from "lucide-react"

interface ReviewFormProps {
  onSubmit: (review: {
    rating: number
    comment: string
    wasPresent: boolean
  }) => void
  onCancel?: () => void
}

export function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [wasPresent, setWasPresent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || rating < 1) return
    setSubmitting(true)
    try {
      onSubmit({ rating, comment: comment.trim(), wasPresent })
      setRating(0)
      setHoveredRating(0)
      setComment("")
      setWasPresent(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Escribir Reseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el set?"
              rows={4}
              required
            />
          </div>

          <div className="space-y-1">

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const value = i + 1
                const isActive = value <= (hoveredRating || rating)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1"
                    aria-label={`Puntuación ${value}`}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isActive
                          ? "fill-emerald-500 text-emerald-500"
                          : "text-neutral-600 hover:text-emerald-400"
                      )}
                    />
                  </button>
                )
              })}

              <button
                type="button"
                role="switch"
                aria-checked={wasPresent}
                onClick={() => setWasPresent(v => !v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setWasPresent(v => !v)
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition",
                  "border",
                  wasPresent
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                    : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
                )}
              >
                <MapPin className={cn("h-4 w-4", wasPresent ? "text-emerald-400" : "text-neutral-400")} />
                <span className="font-medium">{wasPresent ? "I WAS THERE" : "I WAS NOT THERE"}</span>
              </button>
            </div>
          </div>

          
            
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={submitting || rating < 1 || !comment.trim()}>
              {submitting ? "Enviando..." : "Publicar reseña"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
