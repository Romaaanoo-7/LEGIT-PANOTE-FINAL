
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()

        // Create 'images' bucket if it doesn't exist
        const { data, error } = await supabase
            .storage
            .createBucket('images', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            })

        if (error) {
            // If error says expecting 200 but got 400, it might already exist. 
            // We'll check listBuckets to be sure or just assume success if it exists.
            if (error.message.includes('already exists')) {
                return NextResponse.json({ message: 'Bucket "images" already exists' })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Bucket "images" created successfully', data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
