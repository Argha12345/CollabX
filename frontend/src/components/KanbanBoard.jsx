import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

const KanbanBoard = ({ workspaceId }) => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const { socket } = useContext(SocketContext);

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
      socket.emit('join-workspace', workspaceId);
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
      const position = cards.filter(c => c.list === listId).length;
      await api.post('/kanban/card', { title, description: '', listId, position });
      if (socket) socket.emit('kanban-update', workspaceId);
      fetchBoard();
    } catch (err) { }
  };

  const moveCard = async (cardId, newListId) => {
    try {
      await api.put(`/kanban/card/${cardId}`, { listId: newListId, position: 0 });
      if (socket) socket.emit('kanban-update', workspaceId);
      fetchBoard();
    } catch (err) { }
  };

  const handleDeleteCard = async (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you really sure you wanted to delete this card?')) {
      try {
        await api.delete(`/kanban/card/${cardId}`);
        setCards(cards.filter(c => c._id !== cardId));
        if (socket) socket.emit('kanban-update', workspaceId);
      } catch (err) { }
    }
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      await api.put(`/kanban/card/${editingCard._id}`, { 
        title: editingCard.title, 
        description: editingCard.description 
      });
      setCards(cards.map(c => c._id === editingCard._id ? editingCard : c));
      setEditingCard(null);
      if (socket) socket.emit('kanban-update', workspaceId);
    } catch(err) {
      alert("Error updating card");
    }
  };

  const handleDeleteList = async (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you absolutely sure you want to delete this ENTIRE list and everything in it?')) {
      try {
        await api.delete(`/kanban/list/${listId}`);
        setLists(lists.filter(l => l._id !== listId));
        setCards(cards.filter(c => c.list !== listId));
        if (socket) socket.emit('kanban-update', workspaceId);
      } catch (err) { }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Kanban Board</h3>
        <button 
          onClick={handleAddList}
          className="flex items-center space-x-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition"
        >
          <Plus size={20} /> <span>Add List</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-x-auto space-x-6 pb-4">
        {lists.map(list => (
          <div key={list._id} className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700">{list.title}</h4>
              <button 
                onClick={(e) => handleDeleteList(e, list._id)}
                className="text-gray-400 hover:text-red-500 transition px-1"
                title="Delete Column"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 relative p-1">
              {cards.filter(c => c.list === list._id).map(card => (
                <div key={card._id} className="bg-white p-3 pt-4 rounded shadow-sm border border-gray-200 cursor-move hover:border-primary-400 group relative">
                  <div className="absolute top-1 right-7 opacity-0 group-hover:opacity-100 transition z-10">
                    <button 
                      onClick={() => setEditingCard(card)}
                      className="text-gray-300 hover:text-primary-600 p-1 rounded"
                      title="Edit Task"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteCard(e, card._id)}
                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 z-10"
                    title="Delete Card"
                  >
                    <Trash2 size={14} />
                  </button>
                  <p className="font-medium text-gray-800 mb-1 pr-6">{card.title}</p>
                  {card.description && <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>}
                  
                  {/* Quick action to move card to next list for demonstration */}
                  <div className="mt-2 flex justify-between opacity-0 group-hover:opacity-100 transition absolute bottom-2 right-2 left-2 bg-white/90 px-1">
                    <button 
                      onClick={() => {
                        const currentIndex = lists.findIndex(l => l._id === list._id);
                        const prevList = lists[currentIndex - 1];
                        if (prevList) moveCard(card._id, prevList._id);
                      }}
                      className="text-xs text-gray-500 hover:text-primary-600"
                    >
                      &larr; Prev
                    </button>
                    <button 
                      onClick={() => {
                        const currentIndex = lists.findIndex(l => l._id === list._id);
                        const nextList = lists[currentIndex + 1];
                        if (nextList) moveCard(card._id, nextList._id);
                      }}
                      className="text-xs text-primary-600 hover:underline font-medium"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => handleAddCard(list._id)}
              className="mt-4 flex items-center space-x-1 text-gray-500 hover:text-gray-800 p-2 rounded hover:bg-gray-200 transition w-full"
            >
              <Plus size={16} /> <span>Add a card</span>
            </button>
          </div>
        ))}
        {lists.length === 0 && (
          <div className="text-gray-500 italic flex-1 flex items-center justify-center">
            No lists created yet. Click "Add List" to begin.
          </div>
        )}
      </div>

      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-lg text-gray-800 flex items-center space-x-2">
                 <Edit2 size={18} className="text-primary-600"/>
                 <span>Edit Task</span>
               </h3>
               <button onClick={() => setEditingCard(null)} className="text-gray-400 hover:text-gray-600 transition bg-white rounded-full p-1 shadow-sm"><X size={18}/></button>
            </div>
            <form onSubmit={handleUpdateCard} className="p-6 space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                 <input 
                   type="text" 
                   value={editingCard.title} 
                   onChange={e => setEditingCard({...editingCard, title: e.target.value})} 
                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-primary-500 focus:bg-white transition" 
                   required 
                 />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Optional)</label>
                 <textarea 
                   value={editingCard.description || ''} 
                   onChange={e => setEditingCard({...editingCard, description: e.target.value})} 
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md h-32 resize-none focus:ring-primary-500 focus:bg-white transition" 
                   placeholder="Add a more detailed description outlining requirements..." 
                 />
               </div>
               <div className="pt-4 flex justify-end items-center border-t border-gray-100 space-x-3">
                 <button type="button" onClick={() => setEditingCard(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition">Cancel</button>
                 <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-sm transition">Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
