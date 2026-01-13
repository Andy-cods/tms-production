import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CustomFieldSummaryProps {
  fields: Array<{
    field: {
      label: string;
      type: string;
    };
    value: any;
  }>;
  maxDisplay?: number;
}

export function CustomFieldSummary({
  fields,
  maxDisplay = 3,
}: CustomFieldSummaryProps) {
  if (fields.length === 0) return null;

  const displayFields = fields.slice(0, maxDisplay);
  const remainingCount = fields.length - maxDisplay;

  function getSummaryValue(field: any) {
    const { type, value } = field;

    if (!value) return null;

    switch (type) {
      case "SELECT":
        return (
          <Badge variant="outline" className="text-xs">
            {String(value)}
          </Badge>
        );

      case "MULTISELECT":
        const vals = Array.isArray(value) ? value : [];
        return vals.length > 0 ? (
          <Badge variant="outline" className="text-xs">
            {String(vals[0])}{" "}
            {vals.length > 1 && `+${vals.length - 1}`}
          </Badge>
        ) : null;

      case "CHECKBOX":
        return value ? "✓" : "✗";

      case "NUMBER":
        return String(value);

      default:
        return null;
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayFields.map((item, i) => {
        const summaryValue = getSummaryValue({
          type: item.field.type,
          value: item.value,
        });

        if (!summaryValue) return null;

        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="font-medium">{item.field.label}:</span>
                  <span>{summaryValue}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.field.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Info className="h-3 w-3 mr-1" />+{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

