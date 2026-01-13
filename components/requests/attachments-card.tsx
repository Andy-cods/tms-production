"use client";

import { 
  Paperclip, 
  Download, 
  File, 
  FileText, 
  Image, 
  FileVideo, 
  FileAudio,
  Archive
} from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number;
  mimeType?: string;
  driveLink?: string | null;
  externalUrl?: string | null;
}

interface AttachmentsCardProps {
  attachments: Attachment[];
}

export function AttachmentsCard({ attachments }: AttachmentsCardProps) {
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" />;
    }
    
    if (mimeType?.startsWith('video/')) {
      return <FileVideo className="w-5 h-5 text-purple-600" />;
    }
    
    if (mimeType?.startsWith('audio/')) {
      return <FileAudio className="w-5 h-5 text-orange-600" />;
    }
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-5 h-5 text-gray-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) {
      return 'bg-green-100 group-hover:bg-green-200';
    }
    
    if (mimeType?.startsWith('video/')) {
      return 'bg-purple-100 group-hover:bg-purple-200';
    }
    
    if (mimeType?.startsWith('audio/')) {
      return 'bg-orange-100 group-hover:bg-orange-200';
    }
    
    switch (extension) {
      case 'pdf':
        return 'bg-red-100 group-hover:bg-red-200';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 group-hover:bg-blue-200';
      case 'xls':
      case 'xlsx':
        return 'bg-green-100 group-hover:bg-green-200';
      case 'ppt':
      case 'pptx':
        return 'bg-orange-100 group-hover:bg-orange-200';
      case 'zip':
      case 'rar':
      case '7z':
        return 'bg-gray-100 group-hover:bg-gray-200';
      default:
        return 'bg-gray-100 group-hover:bg-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Paperclip className="w-5 h-5 text-primary" />
        Tệp đính kèm ({attachments.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {attachments.map(attachment => {
          const downloadUrl = attachment.fileUrl || attachment.driveLink || attachment.externalUrl;
          const apiDownloadUrl = `/api/attachments/${attachment.id}/download`;
          
          return (
            <a
              key={attachment.id}
              href={downloadUrl ? apiDownloadUrl : "#"}
              target={downloadUrl ? "_blank" : undefined}
              rel={downloadUrl ? "noopener noreferrer" : undefined}
              download={downloadUrl ? attachment.fileName : undefined}
              onClick={(e) => {
                if (!downloadUrl) {
                  e.preventDefault();
                  alert("File không có URL để tải xuống");
                }
              }}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${getFileTypeColor(attachment.fileName, attachment.mimeType)}`}>
                {getFileIcon(attachment.fileName, attachment.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {getFileSize(attachment.fileSize)}
                </p>
              </div>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
