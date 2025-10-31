"use client"

import { useRef, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const MAX_FILE_SIZE_BYTES = 300 * 1024 

export function AvatarUploader({
  currentAvatarUrl,
  displayName,
}: {
  currentAvatarUrl?: string | null
  displayName?: string
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const initials =
    (displayName || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Solo imágenes")
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("La imagen es demasiado grande (máx 300 KB).")
      return
    }

    setUploading(true)
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabaseBrowser.auth.getUser()
      if (userErr || !user) {
        alert("No estás autenticado")
        return
      }

      const ext = file.name.split(".").pop() || "png"
      const filePath = `${user.id}.${ext}`

      const { error: uploadErr } = await supabaseBrowser.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadErr) {
        console.error(uploadErr)
        alert(uploadErr.message || "Error subiendo el avatar")
        return
      }

      const {
        data: { publicUrl },
      } = supabaseBrowser.storage.from("avatars").getPublicUrl(filePath)

      const { error: updateErr } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateErr) {
        console.error(updateErr)
        alert("Avatar subido pero no se pudo guardar en el perfil")
        return
      }

      // refrescamos
      window.location.reload()
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function openFilePicker() {
    if (uploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-20 w-20"
      >
        <Avatar className="h-20 w-20 ring-2 ring-border">
          {currentAvatarUrl ? <AvatarImage src={currentAvatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={openFilePicker}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
        >
          <span className="text-xs font-medium text-white">
            {uploading ? "Subiendo..." : "Cambiar"}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
