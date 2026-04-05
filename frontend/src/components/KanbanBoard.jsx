import React, { useEffect, useState, useContext, useMemo } from 'react';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, X, Edit2, Mic, RefreshCw, Send } from 'lucide-react';
import KanbanListContainer from './KanbanListContainer';
import KanbanCardItem from './KanbanCardItem';

const KanbanBoard = ({ workspaceId }) => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const { socket } = useContext(SocketContext);
  const [isListening, setIsListening] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setAiPrompt(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAiTaskSubmit = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      await api.post('/kanban/ai-card', { prompt: aiPrompt, workspaceId });
      if (socket) socket.emit('kanban-update', workspaceId);
      setAiPrompt('');
      fetchBoard();
    } catch (err) {
      alert("AI failed to create task.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking edit/delete
      },
    })
  );

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/kanban/${workspaceId}`);
      setLists(data.lists);
      setCards(data.cards);
    } catch (err) {
      console.error('Error fetching board', err);
    }
  };

  useEffect(() => {
    fetchBoard();
    if (socket) {
      socket.on('kanban-changed', fetchBoard);
      return () => socket.off('kanban-changed', fetchBoard);
    }
  }, [workspaceId, socket]);

  const handleAddList = async () => {
    const title = window.prompt('List Title:');
    if (!title) return;
    try {
      await api.post('/kanban/list', { title, workspaceId, position: lists.length });
      if (socket) socket.emit('kanban-update', workspaceId);
      fetchBoard();
    } catch (err) { }
  };

  const handleAddCard = async (listId) => {
    const title = window.prompt('Card Title:');
    if (!title) return;
    try {
      const position = cards.filter(c => c.listId === listId).length;
      await api.post('/kanban/card', { title, description: '', listId, position });
      if (socket) socket.emit('kanban-update', workspaceId);
      fetchBoard();
    } catch (err) { }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const card = cards.find(c => c._id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Check if dragging over a different list container or a different card
    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverList = over.data.current?.type === 'List';

    if (!isActiveCard) return;

    const activeCard = cards.find(c => c._id === activeId);
    
    // Find target list
    let targetListId = null;
    if (isOverCard) {
      const overCard = cards.find(c => c._id === overId);
      targetListId = overCard.listId;
    } else if (isOverList) {
      targetListId = over.id;
    }

    if (targetListId && activeCard.listId !== targetListId) {
      setCards((prev) => {
        const updated = [...prev];
        const cardIndex = updated.findIndex(c => c._id === activeId);
        updated[cardIndex] = { ...updated[cardIndex], listId: targetListId };
        return updated;
      });
    }
  };

  const handleDragEnd = async (event) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveCard = active.data.current?.type === 'Card';
    if (!isActiveCard) return;

    setCards(async (prevCardsPromise) => {
      // Note: we're using a snapshot of current state from cards
      const currentCards = [...cards];
      const activeIndex = currentCards.findIndex(c => c._id === activeId);
      const overIndex = currentCards.findIndex(c => c._id === overId);

      let newCards = currentCards;
      
      if (activeIndex !== overIndex) {
         // Sortable move (reordering)
         newCards = arrayMove(currentCards, activeIndex, overIndex >= 0 ? overIndex : activeIndex);
      }

      // Final processing: Re-assign positions for the affected list(s)
      const listIdsToUpdate = Array.from(new Set([newCards[activeIndex].listId]));
      
      const finalCards = newCards.map((c, i) => {
        // Simple position calculation based on current order in the array
        // We filter by listId and set position to its relative index within that list
        const listCards = newCards.filter(rc => rc.listId === c.listId);
        const relPos = listCards.findIndex(rc => rc._id === c._id);
        return { ...c, position: relPos };
      });

      // Persist to backend
      try {
        await api.put('/kanban/reorder/cards', { cards: finalCards.map(c => ({ id: c._id, listId: c.listId, position: c.position })) });
        if (socket) socket.emit('kanban-update', workspaceId);
      } catch (err) {
        console.error('Persistence failed', err);
        fetchBoard(); // Rollback on error
      }

      setCards(finalCards);
      return finalCards;
    });
  };

  const handleDeleteCard = async (e, cardId) => {
    if (window.confirm('Delete this card?')) {
      try {
        await api.delete(`/kanban/card/${cardId}`);
        setCards(cards.filter(c => c._id !== cardId));
        if (socket) socket.emit('kanban-update', workspaceId);
      } catch (err) { }
    }
  };

  const handleDeleteList = async (e, listId) => {
    if (window.confirm('Delete ENTIRE list?')) {
      try {
        await api.delete(`/kanban/list/${listId}`);
        setLists(lists.filter(l => l._id !== listId));
        setCards(cards.filter(c => c.listId !== listId));
        if (socket) socket.emit('kanban-update', workspaceId);
      } catch (err) { }
    }
  };

  const updateCardDetails = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/kanban/card/${editingCard._id}`, { title: editingCard.title, description: editingCard.description });
      setCards(cards.map(c => c._id === editingCard._id ? editingCard : c));
      setEditingCard(null);
      if (socket) socket.emit('kanban-update', workspaceId);
    } catch(err) { }
  };

  return (
    <div className="h-full flex flex-col pt-2">
      <div className="flex justify-between items-center mb-8 px-1">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kanban Board</h3>
          <p className="text-sm text-gray-500 font-medium">Drag and drop to reorder tasks</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* AI Voice Input */}
          <div className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${isListening ? 'bg-red-50 border-red-100' : 'bg-gray-100/50 border-gray-100'} border`}>
             {aiPrompt && (
               <div className="flex items-center gap-2 px-3 animate-in fade-in slide-in-from-right-2">
                  <input 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 w-48 outline-none"
                    placeholder="Describe your task..."
                  />
                  <button onClick={handleAiTaskSubmit} disabled={isAiLoading} className="text-primary-600 hover:text-primary-700">
                    {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
               </div>
             )}
             <button 
               onClick={startVoiceInput}
               className={`p-2.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-600 hover:text-primary-600 shadow-sm'}`}
               title="Create task with voice"
             >
               <Mic size={18} />
             </button>
          </div>

          <button 
            onClick={handleAddList}
            className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-800 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-primary-400 hover:text-primary-700 transition"
          >
            <Plus size={20} /> <span className="font-semibold">Add List</span>
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-x-auto space-x-6 pb-6 pr-6 custom-scrollbar">
          {lists.map(list => (
            <KanbanListContainer 
              key={list._id} 
              list={list} 
              cards={cards.filter(c => c.listId === list._id).sort((a,b) => a.position - b.position)}
              onAddCard={handleAddCard}
              onDeleteList={handleDeleteList}
              onEditCard={setEditingCard}
              onDeleteCard={handleDeleteCard}
            />
          ))}
          {lists.length === 0 && (
            <div className="text-gray-400 font-medium italic flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl mx-1 bg-white/50">
              <p>No lists created yet.</p>
              <button 
                onClick={handleAddList}
                className="mt-4 text-primary-600 font-bold hover:underline"
              >
                Create your first list &rarr;
              </button>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <KanbanCardItem 
              card={activeCard} 
              onEdit={() => {}} 
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
               <h3 className="font-black text-xl text-gray-900 flex items-center space-x-3">
                 <div className="bg-primary-100 p-2 rounded-lg text-primary-600"><Edit2 size={18}/></div>
                 <span>Edit Task</span>
               </h3>
               <button onClick={() => setEditingCard(null)} className="text-gray-400 hover:text-gray-700 transition p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={updateCardDetails} className="p-6 space-y-6">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
                 <input 
                   type="text" 
                   value={editingCard.title} 
                   onChange={e => setEditingCard({...editingCard, title: e.target.value})} 
                   className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white outline-none transition font-semibold" 
                   required 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                 <textarea 
                   value={editingCard.description || ''} 
                   onChange={e => setEditingCard({...editingCard, description: e.target.value})} 
                   className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl h-40 resize-none focus:border-primary-500 focus:bg-white outline-none transition text-sm leading-relaxed" 
                   placeholder="Add more details about this task..." 
                 />
               </div>
               <div className="pt-2 flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingCard(null)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                 <button type="submit" className="px-8 py-3 text-sm font-black bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition active:scale-95">Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
