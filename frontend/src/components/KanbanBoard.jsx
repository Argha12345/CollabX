import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Plus } from 'lucide-react';

const KanbanBoard = ({ workspaceId }) => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
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
            <h4 className="font-bold text-gray-700 mb-4">{list.title}</h4>
            <div className="flex-1 overflow-y-auto space-y-3">
              {cards.filter(c => c.list === list._id).map(card => (
                <div key={card._id} className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-move hover:border-primary-400 group relative">
                  <p className="font-medium text-gray-800 mb-1">{card.title}</p>
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
    </div>
  );
};

export default KanbanBoard;
