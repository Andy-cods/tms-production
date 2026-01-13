import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FIELD_TYPE_META } from "@/types/custom-fields";

export default async function TemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Request templates are not supported in current schema
  notFound();

  return (
    <div className="p-6 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/templates"><ArrowLeft className="h-4 w-4 mr-2" />Back to Templates</Link>
      </Button>

      {/* Unreachable because of notFound above */}
    </div>
  );
}
