import { NextResponse } from "next/server";

export async function GET() {
    // Placeholder for future OAuth callback implementation
    // Currently allows the build to pass by exporting a valid module
    return NextResponse.json(
        { message: "Auth callback not implemented yet" },
        { status: 501 }
    );
}
