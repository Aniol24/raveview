"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  display_name: z.string().min(2, "Mínimo 2 caracteres"),
})

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const fLogin = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const fReg = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", display_name: "" },
  })

  const syncSessionToServer = async () => {
    const { data: { session } } = await supabaseBrowser.auth.getSession()
    if (!session) return
    await fetch("/api/auth/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    })
  }

  const onLogin = (v: z.infer<typeof loginSchema>) =>
    startTransition(async () => {
      setErr(null); setMsg(null)
      const { error } = await supabaseBrowser.auth.signInWithPassword(v)
      if (error) {
        setErr(error.message)
        return
      }

      await syncSessionToServer()

      router.push("/")
      router.refresh()
    })

  const onRegister = (v: z.infer<typeof registerSchema>) =>
    startTransition(async () => {
      setErr(null); setMsg(null)

      const { error } = await supabaseBrowser.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          data: { display_name: v.display_name },
          emailRedirectTo: typeof window !== "undefined" ? `${location.origin}/login` : undefined,
        },
      })

      if (error) {
        setErr(error.message)
        return
      }



      setMsg("Revisa tu email para confirmar la cuenta y luego inicia sesión.")
      setTab("login")
    })

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accede a RAVEVIEW</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form className="space-y-4" onSubmit={fLogin.handleSubmit(onLogin)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" {...fLogin.register("email")} />
                  {fLogin.formState.errors.email && (
                    <p className="text-sm text-destructive">{fLogin.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" autoComplete="current-password" {...fLogin.register("password")} />
                  {fLogin.formState.errors.password && (
                    <p className="text-sm text-destructive">{fLogin.formState.errors.password.message}</p>
                  )}
                </div>
                {err && <p className="text-sm text-destructive">{err}</p>}
                {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form className="space-y-4" onSubmit={fReg.handleSubmit(onRegister)}>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Nombre público</Label>
                  <Input id="display_name" {...fReg.register("display_name")} />
                  {fReg.formState.errors.display_name && (
                    <p className="text-sm text-destructive">{fReg.formState.errors.display_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_reg">Email</Label>
                  <Input id="email_reg" type="email" autoComplete="email" {...fReg.register("email")} />
                  {fReg.formState.errors.email && (
                    <p className="text-sm text-destructive">{fReg.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_reg">Contraseña</Label>
                  <Input id="password_reg" type="password" autoComplete="new-password" {...fReg.register("password")} />
                  {fReg.formState.errors.password && (
                    <p className="text-sm text-destructive">{fReg.formState.errors.password.message}</p>
                  )}
                </div>
                {err && <p className="text-sm text-destructive">{err}</p>}
                {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
