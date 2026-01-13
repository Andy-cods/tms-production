"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { X, Upload, File as FileIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onUpload: (files: any[]) => void;
  className?: string;
}

export function FileUpload({
  multiple = false,
  maxFiles = 3,
  maxSize = 20 * 1024 * 1024,
  onUpload,
  className = "",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > maxFiles) {
        toast.error(`Chỉ được tải tối đa ${maxFiles} files`);
        return;
      }

      for (const file of acceptedFiles) {
        if (file.size > maxSize) {
          toast.error(`File ${file.name} vượt quá ${maxSize / 1024 / 1024}MB`);
          return;
        }
      }

      setFiles(acceptedFiles);

      const uploadedFiles = acceptedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        method: "FILE",
      }));

      onUpload(uploadedFiles);
      toast.success(`Đã chọn ${acceptedFiles.length} file`);
    },
    [maxFiles, maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
  });

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    const uploadedFiles = newFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      method: "FILE",
    }));

    onUpload(uploadedFiles);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-gray-100 rounded-full">
            <Upload className="h-8 w-8 text-gray-600" />
          </div>

          {isDragActive ? (
            <p className="text-primary-600 font-medium">Thả file vào đây...</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-1">Kéo thả file hoặc click để chọn</p>
              <p className="text-sm text-gray-500">Tối đa {maxFiles} files, {maxSize / 1024 / 1024}MB/file</p>
              <p className="text-xs text-gray-400 mt-2">PDF, DOCX, XLSX, JPG, PNG, ZIP</p>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Files đã chọn ({files.length}):</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

