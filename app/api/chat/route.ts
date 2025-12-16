import { NextResponse } from "next/server";

export async function POST(request: Request) {
    // Placeholder for Chat API implementation
    // Currently allows the build to pass by exporting a valid module
    return NextResponse.json(
        { message: "Chat API not implemented yet" },
        { status: 501 }
    );
}
