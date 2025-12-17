
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('include_deleted') === 'true'

    let query = supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    // If we don't explicitly want deleted notes, we filter them out.
    // However, since we are fetching by ID, it might be better to return it 
    // and let the client decide, OR return 404 if deleted and not requested.
    // The plan said "ignoring deleted notes unless explicitly requested".

    const { data: note, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (note.is_deleted && !includeDeleted) {
        return NextResponse.json({ error: 'Note not found (deleted)' }, { status: 404 })
    }

    return NextResponse.json(note)
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const json = await request.json()

        // Allow updating title, content, tag_id, is_deleted (for restore), and is_pinned
        const { title, content, tag_id, is_deleted, is_pinned } = json

        const updateData: any = {
            updated_at: new Date().toISOString(),
        }
        if (title !== undefined) updateData.title = title
        if (content !== undefined) updateData.content = content
        if (tag_id !== undefined) updateData.tag_id = tag_id || null
        if (is_pinned !== undefined) updateData.is_pinned = is_pinned
        if (is_deleted !== undefined) {
            updateData.is_deleted = is_deleted
            if (is_deleted === false) {
                updateData.deleted_at = null
            } else if (is_deleted === true) {
                updateData.deleted_at = new Date().toISOString()
            }
        }

        const { data: note, error } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(note)
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete
    const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
