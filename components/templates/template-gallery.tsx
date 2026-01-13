import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Zap } from "lucide-react";
import Link from "next/link";

interface TemplateGalleryProps {
  templates: Array<{
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    usageCount: number;
    _count: {
      requests: number;
    };
  }>;
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Chưa có templates nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center text-2xl">
                {template.icon || "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">
                  {template.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {template._count.requests} uses
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {template.description}
              </p>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/admin/templates/${template.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

