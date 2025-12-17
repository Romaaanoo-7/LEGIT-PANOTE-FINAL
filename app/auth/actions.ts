'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
// import { createClient } from '@/utils/supabase/server'
// We will use the server client we created
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting for simplicity, validation should ideally be done with Zod
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Check if email confirmation is required?
    // Usually redirect to a "check your email" page or dashboard if auto-confirm is on
    revalidatePath('/', 'layout')
    // redirect('/') - Removed to allow client-side toast
    return { success: true }
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')
    const callbackUrl = `${origin}/auth/callback?next=/auth/update-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: "Check your email for the password reset link" }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    try {
        // Delete user data
        // We do this manually because we cannot delete the auth user without admin key,
        // but we can clear their data.
        const results = await Promise.all([
            supabase.from('notes').delete().eq('user_id', user.id),
            supabase.from('tags').delete().eq('user_id', user.id),
            supabase.from('chat_messages').delete().eq('user_id', user.id)
        ])

        const errors = results.filter(r => r.error).map(r => r.error?.message)

        if (errors.length > 0) {
            console.error("Deletion errors:", errors)
            return { error: `Failed to delete data: ${errors.join(', ')}` }
        }

        // Attempt to delete the auth user using admin client
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const supabaseAdmin = await createAdminClient()
                const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
                if (deleteUserError) {
                    console.error("Failed to delete auth user:", deleteUserError)
                    // Cannot return error here since data is already gone, just proceed to sign out
                }
            } catch (e) {
                console.error("Admin client creation failed or key invalid", e)
            }
        }

        // Sign out
        await supabase.auth.signOut()

    } catch (e) {
        console.error("Unexpected error during account deletion:", e)
        return { error: "An unexpected error occurred during deletion." }
    }

    revalidatePath('/', 'layout')
    // Return success instead of redirecting to avoid client-side catch block issues
    return { success: true }
}
