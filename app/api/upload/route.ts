import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  validateAvatar, 
  validateBanner, 
  validateImage,
  sanitizeFileName,
  generateSecureFileName,
  FILE_SIZE_LIMITS 
} from '@/lib/utils/file-validation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/upload
 * 
 * Upload file to Supabase Storage
 * 
 * Request:
 * - FormData with 'file' field
 * - Optional 'type' field: 'avatar' | 'banner' | 'post'
 * 
 * Response:
 * - Public URL of uploaded file
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = (formData.get('type') as string) || 'post'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size
    }

    let validation
    if (uploadType === 'avatar') {
      validation = validateAvatar(fileData)
    } else if (uploadType === 'banner') {
      validation = validateBanner(fileData)
    } else {
      validation = validateImage(fileData)
    }

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Determine bucket based on upload type
    const bucket = uploadType === 'avatar' || uploadType === 'banner' 
      ? 'profile-media' 
      : 'post-media'
    
    // Generate unique filename
    const sanitized = sanitizeFileName(file.name)
    const secureName = generateSecureFileName(sanitized)
    const userId = user.id
    const path = `${userId}/${secureName}`

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        duplex: 'half',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
      bucket: bucket
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
