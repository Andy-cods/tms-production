"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { FIELD_TYPE_META, type FieldType } from "@/types/custom-fields";

interface CustomFieldData {
  id?: string;
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  order: number;
}

interface FieldEditorProps {
  field: CustomFieldData;
  index: number;
  onUpdate: (field: CustomFieldData) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function FieldEditor({ field, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const fieldMeta = FIELD_TYPE_META[field.type];

  function handleChange(updates: Partial<CustomFieldData>) {
    onUpdate({ ...field, ...updates });
  }

  function handleOptionsChange(value: string) {
    const options = value.split("\n").map((o) => o.trim()).filter(Boolean);
    handleChange({ options });
  }

  return (
    <Card className="relative">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      <CardHeader className="pl-10 pr-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{fieldMeta.label}</Badge>
              {field.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </div>
            <CardTitle className="text-sm mt-1 truncate">{field.label || "Untitled Field"}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pl-10 pr-4 pb-4 space-y-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Label *</Label>
              <Input value={field.label} onChange={(e) => handleChange({ label: e.target.value })} placeholder="Field label" />
            </div>
            <div>
              <Label>Name (ID)</Label>
              <Input
                value={field.name}
                onChange={(e) => handleChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                placeholder="field_name"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={field.description || ""} onChange={(e) => handleChange({ description: e.target.value })} rows={2} placeholder="Help text for users" />
          </div>

          <div>
            <Label>Field Type</Label>
            <Select value={field.type} onValueChange={(v) => handleChange({ type: v as FieldType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <Label>Required field</Label>
              <p className="text-xs text-gray-500 mt-1">Users must fill this field</p>
            </div>
            <Switch checked={field.isRequired} onCheckedChange={(c) => handleChange({ isRequired: c })} />
          </div>

          {FIELD_TYPE_META[field.type].supportsValidation.minLength && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Length</Label>
                <Input type="number" value={field.minLength || ""} onChange={(e) => handleChange({ minLength: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
              <div>
                <Label>Max Length</Label>
                <Input type="number" value={field.maxLength || ""} onChange={(e) => handleChange({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
            </div>
          )}

          {FIELD_TYPE_META[field.type].supportsValidation.minValue && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Value</Label>
                <Input type="number" value={field.minValue || ""} onChange={(e) => handleChange({ minValue: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input type="number" value={field.maxValue || ""} onChange={(e) => handleChange({ maxValue: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
            </div>
          )}

          {FIELD_TYPE_META[field.type].supportsValidation.pattern && (
            <div>
              <Label>Pattern (Regex)</Label>
              <Input value={field.pattern || ""} onChange={(e) => handleChange({ pattern: e.target.value })} placeholder="^[A-Z0-9]+$" />
            </div>
          )}

          {FIELD_TYPE_META[field.type].supportsValidation.options && (
            <div>
              <Label>Options (1 per line)</Label>
              <Textarea value={field.options?.join("\n") || ""} onChange={(e) => handleOptionsChange(e.target.value)} rows={5} placeholder={"Low\nMedium\nHigh\nCritical"} />
              <p className="text-xs text-gray-500 mt-1">{field.options?.length || 0} options</p>
            </div>
          )}

          <div>
            <Label>Placeholder</Label>
            <Input value={field.placeholder || ""} onChange={(e) => handleChange({ placeholder: e.target.value })} />
          </div>

          <div>
            <Label>Default Value</Label>
            <Input value={field.defaultValue || ""} onChange={(e) => handleChange({ defaultValue: e.target.value })} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onMoveUp} disabled={isFirst}>Up</Button>
            <Button variant="outline" size="sm" onClick={onMoveDown} disabled={isLast}>Down</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}


