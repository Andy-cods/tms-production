import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Copy, Trash2, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    isDefault: boolean;
    usageCount: number;
    category?: { name: string; icon?: string };
    fields: any[];
    _count?: { requests: number };
  };
  onDuplicate: () => void;
  onDelete: () => void;
}

export function TemplateCard({ template, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-2xl">
              {template.icon || "📝"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {template.category && (
                  <Badge variant="outline" className="text-xs">{template.category.icon} {template.category.name}</Badge>
                )}
                {template.isDefault && (
                  <Badge variant="default" className="text-xs">Default</Badge>
                )}
                {!template.isActive && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/templates/${template.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/templates/${template.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{template.fields.length} fields</span>
            {template._count && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {template._count.requests} uses
              </span>
            )}
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/templates/${template.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


