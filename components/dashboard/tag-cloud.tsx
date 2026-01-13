"use client";

import React, { useState, useEffect, useRef } from "react";
import type { TagCloudData } from "@/lib/services/category-service";

interface Props {
  tags: TagCloudData[];
  onTagClick?: (tag: string) => void;
  loading?: boolean;
}

interface PositionedTag extends TagCloudData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Simple layout algorithm for tag cloud
 */
function layoutTags(tags: TagCloudData[], containerWidth: number, containerHeight: number): PositionedTag[] {
  const positioned: PositionedTag[] = [];
  const padding = 10;

  tags.forEach((tag, index) => {
    const fontSize = tag.size;
    const estimatedWidth = tag.tag.length * fontSize * 0.6; // Rough estimate
    const estimatedHeight = fontSize * 1.2;
    
    // Random rotation (some tags rotated)
    const rotation = index % 3 === 0 ? -15 : index % 3 === 1 ? 0 : 15;

    // Spiral layout: Start from center, spiral outwards
    const angle = index * 2.4; // Golden angle for nice distribution
    const radius = Math.sqrt(index + 1) * 30;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const x = centerX + radius * Math.cos(angle) - estimatedWidth / 2;
    const y = centerY + radius * Math.sin(angle) - estimatedHeight / 2;

    // Clamp to container bounds
    const clampedX = Math.max(padding, Math.min(containerWidth - estimatedWidth - padding, x));
    const clampedY = Math.max(padding, Math.min(containerHeight - estimatedHeight - padding, y));

    positioned.push({
      ...tag,
      x: clampedX,
      y: clampedY,
      width: estimatedWidth,
      height: estimatedHeight,
      rotation,
    });
  });

  return positioned;
}

export function TagCloud({ tags, onTagClick, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positionedTags, setPositionedTags] = useState<PositionedTag[]>([]);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || tags.length === 0) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const positioned = layoutTags(tags, width || 600, height || 400);
    setPositionedTags(positioned);
  }, [tags]);

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <p className="text-gray-600">Chưa có tag nào</p>
          <p className="text-sm text-gray-500 mt-1">Tags sẽ hiển thị khi yêu cầu có tag</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag Cloud Canvas */}
      <div 
        ref={containerRef}
        className="relative h-[400px] bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-lg border overflow-hidden"
      >
        {positionedTags.map((tag) => {
          const isHovered = hoveredTag === tag.tag;
          
          return (
            <div
              key={tag.tag}
              className="absolute cursor-pointer transition-all duration-200 select-none"
              style={{
                left: `${tag.x}px`,
                top: `${tag.y}px`,
                fontSize: `${tag.size}px`,
                color: tag.color,
                fontWeight: tag.count > 20 ? 'bold' : tag.count > 10 ? '600' : 'normal',
                transform: `rotate(${tag.rotation}deg) scale(${isHovered ? 1.2 : 1})`,
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredTag(tag.tag)}
              onMouseLeave={() => setHoveredTag(null)}
              onClick={() => onTagClick?.(tag.tag)}
              title={`${tag.tag}: ${tag.count} lần`}
            >
              {tag.tag}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">Mức độ phổ biến:</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>&lt;10 lần</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>10-30 lần</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>&gt;30 lần</span>
            </div>
          </div>
        </div>
        <span className="text-gray-500">Nhấn vào tag để lọc</span>
      </div>

      {/* Top Tags List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Top 10 tags</h4>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 10).map((tag) => (
            <button
              key={tag.tag}
              onClick={() => onTagClick?.(tag.tag)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: `${tag.color}20`, 
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              <span>{tag.tag}</span>
              <span className="bg-white px-1.5 py-0.5 rounded-full text-xs">
                {tag.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

