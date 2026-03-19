import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  validateAvatar, 
  validateBanner,
  sanitizeFileName,
  FILE_SIZE_LIMITS 
} from '@/lib/utils/file-validation'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * Request validation schema
 */
const requestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().min(1).max(FILE_SIZE_LIMITS.BANNER),
  uploadType: z.enum(['avatar', 'banner'])
})

/**
 * POST /api/upload/sign
 * 
 * Generate signed URL for private file upload
 * 
 * Request:
 * - fileName: string
 * - fileType: string
 * - fileSize: number
 * - uploadType: 'avatar' | 'banner'
 * 
 * Response:
 * - Signed upload URL
 * - Public URL after upload
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

    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { fileName, fileType, fileSize, uploadType } = validation.data

    // Validate file based on type
    const fileData = {
      name: fileName,
      type: fileType,
      size: fileSize
    }

    const fileValidation = uploadType === 'avatar' 
      ? validateAvatar(fileData)
      : validateBanner(fileData)

    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // Determine bucket
    const bucket = 'profile-media'
    
    // Generate unique filename
    const sanitized = sanitizeFileName(fileName)
    const secureName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${sanitized.split('.').pop()}`
    const path = `${user.id}/${secureName}`

    // Create signed upload URL (expires in 60 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (signError) {
      console.error('Sign URL error:', signError)
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      )
    }

    // Get public URL (will be valid after upload)
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({
      success: true,
      uploadUrl: signedData.signedUrl,
      publicUrl: publicUrl,
      path: path,
      bucket: bucket,
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Sign URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
