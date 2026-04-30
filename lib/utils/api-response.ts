import { NextResponse } from 'next/server'

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
    },
    { status }
  )
}

export function successResponse<T>(data: T, requestId?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(requestId && { requestId }),
  })
}
