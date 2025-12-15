'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signup } from "@/app/auth/actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      toast.success("Need to verify your account to your given Email address to Login!")
      // Redirect to login page after a short delay to allow toast to be seen
      setTimeout(() => {
        window.location.href = '/login' // or router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-center transition-all duration-500">
        <Image src="/favicon.ico" alt="Logo" width={164} height={164} className="dark:invert transition-all duration-500" />
      </div>
      <Card className="border-2 border-primary transition-all duration-500">
        <CardHeader className="text-center">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input className="border-2 border-primary" id="name" name="full_name" type="text" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  className="border-2 border-primary"
                  id="email"
                  name="email"
                  type="email"

                  required
                />
                <FieldDescription>
                  Please use a working e-mail adrress for Authentication.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input className="border-2 border-primary" id="password" name="password" type="password" required />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <Input className="border-2 border-primary" id="confirm-password" name="confirm_password" type="password" required />
                <FieldDescription>Please confirm your password.</FieldDescription>
              </Field>
              {error && (
                <div className="text-sm text-red-500 font-medium">
                  {error}
                </div>
              )}
              <FieldGroup>
                <Field>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                  <div className="px-6 text-center text-sm text-muted-foreground">
                    Already have an account? <a href="/login" className="underline text-primary">Sign in</a>
                  </div>
                </Field>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
