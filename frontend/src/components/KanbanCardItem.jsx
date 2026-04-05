import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit2 } from 'lucide-react';

const KanbanCardItem = ({ card, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card._id,
    data: {
      type: 'Card',
      card,
    }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="bg-gray-50 border-2 border-primary-200 rounded-lg p-3 h-24 opacity-50 shadow-inner"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 pt-4 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:border-primary-400 active:cursor-grabbing hover:shadow-md transition-shadow group relative"
    >
      <div className="absolute top-1 right-7 opacity-0 group-hover:opacity-100 transition z-10">
        <button 
          onPointerDown={e => e.stopPropagation()} // Prevent drag start
          onClick={() => onEdit(card)}
          className="text-gray-300 hover:text-primary-600 p-1 rounded transition"
          title="Edit Task"
        >
          <Edit2 size={14} />
        </button>
      </div>
      <button 
        onPointerDown={e => e.stopPropagation()}
        onClick={(e) => onDelete(e, card._id)}
        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 z-10"
        title="Delete Card"
      >
        <Trash2 size={14} />
      </button>
      <p className="font-semibold text-gray-800 mb-1 pr-6 leading-tight">{card.title}</p>
      {card.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{card.description}</p>}
    </div>
  );
};

export default KanbanCardItem;
