"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    gamification?: {
      avatarSkin: string;
      avatarHair: string;
      avatarHairColor: string;
      avatarEyes: string;
      avatarMouth: string;
      avatarAccessory: string | null;
      avatarBackground: string;
      level?: number;
    } | null;
  };
}

interface CommentsSectionProps {
  requestId: string;
  comments?: Comment[];
  isLoading?: boolean;
  currentUser?: {
    id: string;
    name: string;
    gamification?: {
      avatarSkin: string;
      avatarHair: string;
      avatarHairColor: string;
      avatarEyes: string;
      avatarMouth: string;
      avatarAccessory: string | null;
      avatarBackground: string;
      level?: number;
    } | null;
  };
  onAddComment?: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export function CommentsSection({ 
  requestId, 
  comments = [], 
  isLoading = false,
  currentUser,
  onAddComment,
  onDeleteComment
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || !onAddComment) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!onDeleteComment) return;
    
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (isLoading) {
    return <CommentsSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Bình luận ({comments.length})
      </h2>

      {/* Comments Timeline */}
      <div className="space-y-6 mb-6">
        {comments.map((comment, index) => (
          <div key={comment.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <UserAvatar 
                user={{
                  id: comment.user.id,
                  name: comment.user.name,
                  gamification: comment.user.gamification || null,
                }}
                size={32}
              />
              {index < comments.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>

            {/* Comment Content */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {comment.user.name}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { 
                        locale: vi, 
                        addSuffix: true 
                      })}
                    </span>
                  </div>
                  {currentUser && comment.user.id === currentUser.id && onDeleteComment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      {currentUser && onAddComment && (
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <UserAvatar 
            user={{
              id: currentUser.id,
              name: currentUser.name,
              gamification: currentUser.gamification || null,
            }}
            size={32}
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="hover:shadow-md transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Gửi bình luận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!comments.length && !currentUser && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có bình luận nào</p>
        </div>
      )}
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-20 w-full bg-gray-200 rounded-xl"></div>
          <div className="h-8 w-24 bg-gray-200 rounded mt-3 ml-auto"></div>
        </div>
      </div>
    </div>
  );
}
