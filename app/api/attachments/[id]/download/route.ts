import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/attachments/[id]/download
 * Download attachment file with authentication check
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            id: true,
            creatorId: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
              },
            },
          },
        },
        task: {
          select: {
            id: true,
            assigneeId: true,
            requestId: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "File không tồn tại" }, { status: 404 });
    }

    // Check permission
    const userId = session.user.id as string;
    const userRole = (session.user as any).role;

    let canDownload = false;

    // Admin can download all
    if (userRole === "ADMIN") {
      canDownload = true;
    }
    // Creator can download
    else if (attachment.request?.creatorId === userId) {
      canDownload = true;
    }
    // Team leader can download
    else if (attachment.request?.team?.leaderId === userId) {
      canDownload = true;
    }
    // Task assignee can download
    else if (attachment.task?.assigneeId === userId) {
      canDownload = true;
    }
    // Uploader can download
    else if (attachment.uploadedById === userId) {
      canDownload = true;
    }

    if (!canDownload) {
      return NextResponse.json({ error: "Không có quyền tải file này" }, { status: 403 });
    }

    // Get download URL
    const downloadUrl = attachment.fileUrl || attachment.driveLink || attachment.externalUrl;

    if (!downloadUrl) {
      return NextResponse.json({ error: "File không có URL để tải xuống" }, { status: 404 });
    }

    // For uploadthing URLs, redirect directly
    if (downloadUrl.includes("uploadthing.com") || downloadUrl.startsWith("https://")) {
      return NextResponse.redirect(downloadUrl);
    }

    // For other URLs, try to fetch and proxy
    try {
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        return NextResponse.json({ error: "Không thể tải file" }, { status: 500 });
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const contentType = attachment.mimeType || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
          "Content-Length": fileBuffer.byteLength.toString(),
        },
      });
    } catch (error) {
      console.error("[download attachment] Error:", error);
      // Fallback: redirect to original URL
      return NextResponse.redirect(downloadUrl);
    }
  } catch (error) {
    console.error("[download attachment] Error:", error);
    return NextResponse.json(
      { error: "Lỗi tải file" },
      { status: 500 }
    );
  }
}

