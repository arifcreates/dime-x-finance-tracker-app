import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

interface DraggableCardProps {
  id: string;
  index: number;
  children: React.ReactNode;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  className?: string;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  index,
  children,
  moveCard,
  className = '',
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'card',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'card',
    hover: (item: { id: string; index: number }) => {
      if (!item) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`relative group ${className} ${
        isDragging ? 'opacity-50 scale-105' : ''
      } transition-all duration-200`}
    >
      {/* Drag Handle */}
      <div
        ref={drag}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      {children}
    </div>
  );
};