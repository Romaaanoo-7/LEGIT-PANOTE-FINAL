
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Ensure unique filename
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

        // Use Admin Client to bypass RLS for upload
        const parsedAdmin = await createAdminClient()

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        const { data, error } = await parsedAdmin.storage
            .from('images')
            .upload(filename, buffer, {
                contentType: file.type,
            })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = parsedAdmin.storage
            .from('images')
            .getPublicUrl(filename)

        return NextResponse.json({ publicUrl })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
