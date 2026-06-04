/**
 * ============================================================================
 * AI Chat File Upload Endpoint
 * ============================================================================
 *
 * Dedicated upload endpoint for AI mentor/assistant file attachments.
 * Uploads files to Supabase Storage (post-media bucket) and returns
 * public URLs that get included in AI prompts as context.
 *
 * Supports: images (jpeg, png, gif, webp), documents (pdf, txt, json, csv),
 *           and code files (js, ts, py, md, etc.)
 *
 * @see {@link /lib/utils/file-validation.ts} — for validation utilities
 * ============================================================================
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeFileName, generateSecureFileName } from '@/lib/utils/file-validation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30 seconds for uploads

const ALLOWED_CHAT_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // Documents
  'application/pdf', 'text/plain', 'text/csv',
  'application/json', 'text/html',
  // Code
  'text/javascript', 'text/typescript', 'text/jsx', 'text/tsx',
  'text/markdown', 'text/yaml', 'text/x-python', 'text/x-java',
  'text/x-rust', 'text/x-go', 'text/x-c', 'text/x-cpp',
  // Archives
  'application/zip', 'application/gzip',
] as const

const MAX_CHAT_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_CHAT_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size is ${MAX_CHAT_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate MIME type (relaxed — accept common types)
    const isAllowed = ALLOWED_CHAT_TYPES.some(t => file.type.startsWith(t.split('/')[0]) || file.type === t)
    if (!isAllowed && !file.type.startsWith('image/')) {
      // For unknown types, still allow but mark as generic
      console.warn(`⚠️ AI Chat upload: unknown file type "${file.type}" for "${file.name}"`)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Validate user ID UUID to prevent path traversal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Generate secure filename
    const sanitized = sanitizeFileName(file.name)
    const secureName = generateSecureFileName(sanitized)
    const path = `chat/${user.id}/${secureName}`

    // Upload to post-media bucket
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(path, buffer, {
        contentType: file.type,
        duplex: 'half',
        upsert: false,
      })

    if (uploadError) {
      console.error('AI chat upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(path)

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      mediaType: file.type,
      size: file.size,
    })
  } catch (error) {
    console.error('AI chat upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
