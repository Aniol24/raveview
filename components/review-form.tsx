"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReviewStars } from "./review-stars";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ReviewSchema = z.object({
  rating: z.number().min(0.5, "Min 0.5").max(5, "Max 5"),
  body: z.string().min(4, "Cuéntanos algo más 🙏").max(2000, "Máximo 2000 caracteres"),
  wasThere: z.boolean().default(false),
});

type ReviewInput = z.infer<typeof ReviewSchema>;

export function ReviewForm({ setId }: { setId: string }) {
  const client = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ReviewInput>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { rating: 4, body: "", wasThere: false },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: async (data: ReviewInput) => {
      // TODO: userId viene de Auth (Clerk); de momento mockeado
      return createReview({ ...data, setId, userId: "mock-user" });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["reviews", setId] });
      setSubmitting(false);
      form.reset({ rating: 4, body: "", wasThere: false });
    },
    onError: () => setSubmitting(false),
  });

  const onSubmit = (data: ReviewInput) => {
    setSubmitting(true);
    mutation.mutate(data);
  };

  const rating = form.watch("rating");

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Your rating</Label>
        <ReviewStars
          value={rating}
          onChange={(v) => form.setValue("rating", v, { shouldDirty: true, shouldValidate: true })}
        />
        {form.formState.errors.rating ? (
          <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Your review</Label>
        <Textarea
          id="body"
          placeholder="¿Qué te gustó? ¿Momentazos, blends, selección, energía…?"
          {...form.register("body")}
          rows={5}
        />
        {form.formState.errors.body ? (
          <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-1">
          <Label htmlFor="wasThere">I was there</Label>
          <p className="text-xs text-muted-foreground">Marca si asististe al evento de este set.</p>
        </div>
        <Switch
          id="wasThere"
          checked={form.watch("wasThere")}
          onCheckedChange={(v) => form.setValue("wasThere", v)}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? "Publishing…" : "Publish review"}
        </Button>
        <Button variant="secondary" type="button" onClick={() => form.reset()}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
