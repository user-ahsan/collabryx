import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  validateAvatar, 
  validateBanner, 
  validateImage,
  sanitizeFileName,
  generateSecureFileName
} from '@/lib/utils/file-validation'
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { errorResponse, successResponse } from '@/lib/utils/api-response';

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
  // Validate CSRF token for security
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value || null;
  
  if (requiresCSRF(request.method)) {
    const isValid = await validateCSRFRequest(csrfToken, cookieToken);
    if (!isValid) {
      console.warn('⚠️ CSRF validation failed:', {
        hasHeaderToken: !!csrfToken,
        hasCookieToken: !!cookieToken,
        path: request.url,
      });
      return errorResponse('INVALID_CSRF', 'Invalid CSRF token', 403)
    }
  }
  
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized', 401)
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = (formData.get('type') as string) || 'post'
    
    if (!file) {
      return errorResponse('NO_FILE', 'No file provided', 400)
    }

// Read file as ArrayBuffer FIRST - needed for magic byte validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size
    }

    let validation
    if (uploadType === 'avatar') {
      validation = validateAvatar(fileData, buffer)
    } else if (uploadType === 'banner') {
      validation = validateBanner(fileData, buffer)
    } else {
      validation = validateImage(fileData, buffer)
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
    
    // Validate user ID is a UUID to prevent path traversal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) throw new Error('Invalid user ID');

    // Generate unique filename
    const sanitized = sanitizeFileName(file.name)
    const secureName = generateSecureFileName(sanitized)
    const userId = user.id
    const path = `${userId}/${secureName}`

    // Upload to Supabase Storage
    // Note: file.type has already passed magic-byte validation above, so it is
    // the verified MIME type (not a spoofed browser header).
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        duplex: 'half',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return errorResponse('UPLOAD_FAILED', 'Failed to upload file', 500)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return successResponse({
      url: publicUrl,
      path: uploadData.path,
      bucket: bucket
    })

  } catch (error) {
    console.error('Upload error:', error)
      return errorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
