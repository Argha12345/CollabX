import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Folder, Plus, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await api.get('/workspaces');
        setWorkspaces(data);
      } catch (err) {
        console.error('Failed to fetch workspaces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    const name = window.prompt('Enter workspace name:');
    if (!name) return;
    try {
      const { data } = await api.post('/workspaces', { name, description: 'Created via Dashboard' });
      setWorkspaces([...workspaces, data]);
    } catch (err) {
      alert('Error creating workspace');
    }
  };

  const handleDeleteWorkspace = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await api.delete(`/workspaces/${id}`);
        setWorkspaces(workspaces.filter(ws => ws._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting workspace');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your workspaces...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
        <button 
          onClick={handleCreateWorkspace}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md shadow hover:bg-primary-700 transition"
        >
          <Plus size={20} />
          <span>New Workspace</span>
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Workspaces</h2>
        {workspaces.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="mb-4">You don't have any workspaces yet.</p>
            <p>Click the "New Workspace" button to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <Link to={`/workspace/${ws._id}`} key={ws._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition border-t-4 border-transparent hover:border-primary-500 group">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-primary-50 p-2 rounded-lg text-primary-600 group-hover:bg-primary-100 transition">
                    <Folder size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{ws.name}</h3>
                  
                  {ws.ownerId === user?.id && (
                    <button 
                      onClick={(e) => handleDeleteWorkspace(e, ws._id)}
                      className="text-gray-400 hover:text-red-500 transition px-2 py-1 z-10"
                      title="Delete Workspace"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{ws.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-xs font-medium text-gray-400">Members: {ws.members?.length || 1}</span>
                   <span className="text-primary-600 text-sm font-medium">Open &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
