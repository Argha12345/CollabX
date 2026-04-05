import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, Plus } from 'lucide-react';
import KanbanCardItem from './KanbanCardItem';

const KanbanListContainer = ({ list, cards, onAddCard, onDeleteList, onEditCard, onDeleteCard }) => {
  const { setNodeRef } = useDroppable({
    id: list._id,
    data: {
      type: 'List',
      listId: list._id,
    }
  });

  return (
    <div 
      ref={setNodeRef} 
      className="bg-gray-100 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col max-h-full border border-transparent hover:border-gray-300 transition-colors shadow-sm"
    >
      <div className="flex justify-between items-center mb-4 px-1">
        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{list.title}</h4>
        <button 
          onClick={(e) => onDeleteList(e, list._id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Delete Column"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[100px]">
        <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardItem 
              key={card._id} 
              card={card} 
              onEdit={onEditCard} 
              onDelete={onDeleteCard} 
            />
          ))}
        </SortableContext>
      </div>

      <button 
        onClick={() => onAddCard(list._id)}
        className="mt-4 flex items-center justify-center space-x-2 text-gray-500 hover:text-primary-700 p-2.5 rounded-lg border border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition w-full font-medium"
      >
        <Plus size={16} /> <span>Add a card</span>
      </button>
    </div>
  );
};

export default KanbanListContainer;
