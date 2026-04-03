import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FileText, LayoutDashboard, Plus } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

const WorkspaceView = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const [wsRes, docRes] = await Promise.all([
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/documents/workspace/${workspaceId}`)
        ]);
        setWorkspace(wsRes.data);
        setDocuments(docRes.data);
      } catch (err) {
        console.error('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceData();
  }, [workspaceId]);

  const handleCreateDocument = async () => {
    const title = window.prompt('Document Title:');
    if (!title) return;
    try {
      const { data } = await api.post('/documents', { title, workspaceId });
      setDocuments([...documents, data]);
    } catch (err) {
      alert('Error creating document');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading workspace details...</div>;
  if (!workspace) return <div className="p-8 text-center text-red-500">Workspace not found</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 truncate">{workspace.name}</h2>
          <p className="text-xs text-gray-500 mt-1 capitalize">{workspace.members.length} members</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeTab === 'documents' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText size={20} />
            <span>Documents</span>
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeTab === 'kanban' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            <span>Kanban Board</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Documents</h3>
              <button 
                onClick={handleCreateDocument}
                className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary-700 transition"
              >
                <Plus size={20} /> <span>New Document</span>
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500 shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="mb-2 font-medium">No documents yet.</p>
                <p className="text-sm">Create one to start collaborating in real-time!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {documents.map((doc) => (
                  <Link to={`/document/${doc._id}`} key={doc._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition group h-32 flex flex-col">
                    <div className="flex items-start space-x-3 mb-auto">
                      <div className="bg-primary-50 p-2 rounded text-primary-600">
                        <FileText size={20} />
                      </div>
                      <h4 className="font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-primary-600 transition truncate">{doc.title}</h4>
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span className="font-medium text-primary-500 opacity-0 group-hover:opacity-100 transition">Edit &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'kanban' && (
          <KanbanBoard workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
};

export default WorkspaceView;
