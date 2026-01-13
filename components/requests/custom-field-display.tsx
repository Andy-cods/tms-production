import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Link as LinkIcon,
  Mail,
  FileText,
} from "lucide-react";

interface CustomFieldDisplayProps {
  fields: Array<{
    id: string;
    field: {
      name: string;
      label: string;
      type: string;
      description?: string;
    };
    value: any;
  }>;
}

export function CustomFieldDisplay({ fields }: CustomFieldDisplayProps) {
  if (fields.length === 0) {
    return null;
  }

  function formatValue(field: any) {
    const { type, value } = field;

    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Không có dữ liệu</span>;
    }

    switch (type) {
      case "TEXT":
      case "TEXTAREA":
        return <p className="text-gray-900">{String(value)}</p>;

      case "NUMBER":
        return (
          <p className="text-gray-900 font-medium">
            {typeof value === "number" ? value.toLocaleString() : String(value)}
          </p>
        );

      case "SELECT":
        return (
          <Badge variant="secondary" className="text-sm">
            {String(value)}
          </Badge>
        );

      case "MULTISELECT":
        const values = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2">
            {values.map((val, i) => (
              <Badge key={i} variant="secondary">
                {String(val)}
              </Badge>
            ))}
          </div>
        );

      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Có</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500">Không</span>
              </>
            )}
          </div>
        );

      case "DATE":
        try {
          return (
            <div className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-4 w-4 text-gray-400" />
              {format(new Date(value), "dd/MM/yyyy", { locale: vi })}
            </div>
          );
        } catch {
          return <span className="text-gray-900">{String(value)}</span>;
        }

      case "DATETIME":
        try {
          return (
            <div className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-4 w-4 text-gray-400" />
              {format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi })}
            </div>
          );
        } catch {
          return <span className="text-gray-900">{String(value)}</span>;
        }

      case "URL":
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <LinkIcon className="h-4 w-4" />
            {String(value)}
          </a>
        );

      case "EMAIL":
        return (
          <a
            href={`mailto:${String(value)}`}
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Mail className="h-4 w-4" />
            {String(value)}
          </a>
        );

      case "FILE":
        return (
          <div className="flex items-center gap-2 text-gray-900">
            <FileText className="h-4 w-4 text-gray-400" />
            {String(value)}
          </div>
        );

      default:
        return <p className="text-gray-900">{String(value)}</p>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 pb-4 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {item.field.label}
                </span>
                {item.field.description && (
                  <span className="text-xs text-gray-500">
                    ({item.field.description})
                  </span>
                )}
              </div>
              <div className="mt-1">
                {formatValue({
                  type: item.field.type,
                  value: item.value,
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

