import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FileText, LayoutDashboard, Plus, UserPlus, Trash2, LogOut, User as UserIcon, Settings, ArrowLeft, Send, X, Check } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import PresenceAvatars from '../components/PresenceAvatars';
import { SocketContext } from '../context/SocketContext';
import WorkspaceAiAssistant from '../components/WorkspaceAiAssistant';
import WorkspaceStandup from '../components/WorkspaceStandup';

const WorkspaceView = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const { socket } = useContext(SocketContext);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

    if (socket) {
      socket.emit('join-workspace', { workspaceId, user: { id: user?.id, name: user?.name, email: user?.email, avatar: user?.avatar } });
      const presenceHandler = (users) => setPresenceUsers(users);
      socket.on('presence-update', presenceHandler);
      return () => socket.off('presence-update', presenceHandler);
    }
  }, [workspaceId, socket]);

  const handleCreateDocument = async () => {
    if (!newDocTitle) return;
    try {
      const { data } = await api.post('/documents', { title: newDocTitle, workspaceId });
      setDocuments([...documents, data]);
      setNewDocTitle('');
      setShowCreateDoc(false);
    } catch (err) {
      console.error('Error creating document');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail) return;
    try {
      await api.post(`/workspaces/${workspaceId}/members`, { email: newMemberEmail });
      setWorkspace({ ...workspace, members: [...workspace.members, { userId: 'new', user: { name: newMemberEmail.split('@')[0] } }] }); // optimistic update
      setNewMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      console.error(err.response?.data?.message || 'Error inviting member');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter(d => d._id !== docId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting document');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading workspace details...</div>;
  if (!workspace) return <div className="p-8 text-center text-red-500">Workspace not found</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-white relative group/header">
          <div className="flex items-center gap-2 mb-4">
             <button onClick={() => navigate('/dashboard')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition">
                <ArrowLeft size={16} />
             </button>
             <h2 className="text-xl font-black text-gray-900 truncate leading-none">{workspace.name}</h2>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  Team <span className="w-1 h-1 bg-gray-300 rounded-full"></span> {workspace.members.length} Members
                </h4>
                <button 
                  onClick={() => setShowAddMember(!showAddMember)}
                  className={`p-1.5 rounded-lg transition-all ${showAddMember ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-primary-600'}`}
                >
                  <UserPlus size={16} />
                </button>
             </div>

             {showAddMember && (
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 animate-in zoom-in-95 duration-200">
                   <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Invite by email..."
                        className="flex-1 bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none p-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                      />
                      <button onClick={handleAddMember} className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                         <Send size={12} />
                      </button>
                   </div>
                </div>
             )}
             <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1 thin-scrollbar">
                {workspace.members.map(member => (
                   <div key={member.userId} className="flex items-center justify-between group/user transition-all">
                      <p className="text-xs text-gray-500 truncate font-semibold">{member.user?.name || 'Unknown User'}</p>
                      {presenceUsers.find(u => u.id === member.userId) && (
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      )}
                   </div>
                ))}
             </div>
          </div>
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
        
        {/* Sidebar Footer: Profile & Logout */}
        <div className="mt-auto border-t border-gray-100 p-4 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-4 group cursor-default">
            <Link to="/profile" className="flex items-center space-x-3 flex-1 overflow-hidden">
               {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm group-hover:ring-2 ring-primary-100 transition-all" />
               ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center border-2 border-white shadow-sm group-hover:ring-2 ring-primary-100 transition-all">
                     <UserIcon size={20} />
                  </div>
               )}
               <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black text-gray-900 truncate tracking-tight">{user?.name}</p>
                  <p className="text-[10px] font-bold text-primary-600 truncate uppercase tracking-widest leading-none mt-0.5">Edit Profile</p>
               </div>
            </Link>
            <Link to="/profile" className="text-gray-300 hover:text-primary-600 transition p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm md:flex hidden items-center justify-center">
                <Settings size={18} />
             </Link>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm active:scale-95 group"
          >
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {activeTab === 'documents' && (
          <div className="max-w-7xl mx-auto">
            <WorkspaceStandup workspaceId={workspaceId} />
            
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Documents</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage your team's collective knowledge</p>
              </div>
              
              <div className="flex items-center gap-3">
                 {showCreateDoc ? (
                    <div className="flex items-center gap-2 bg-white p-1.5 pr-2 rounded-xl border border-primary-100 shadow-sm animate-in slide-in-from-right-2">
                       <input 
                         autoFocus
                         value={newDocTitle}
                         onChange={(e) => setNewDocTitle(e.target.value)}
                         placeholder="New document title..."
                         className="px-3 py-1.5 text-sm font-bold text-gray-700 border-none focus:ring-0 outline-none w-48"
                         onKeyPress={(e) => e.key === 'Enter' && handleCreateDocument()}
                       />
                       <button onClick={handleCreateDocument} className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                          <Check size={16} />
                       </button>
                       <button onClick={() => setShowCreateDoc(false)} className="p-2 text-gray-400 hover:text-gray-600">
                          <X size={16} />
                       </button>
                    </div>
                 ) : (
                    <button 
                      onClick={() => setShowCreateDoc(true)}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all group"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
                      <span>New Document</span>
                    </button>
                 )}
              </div>
            </div>
            
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500 shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="mb-2 font-medium">No documents yet.</p>
                <p className="text-sm">Create one to start collaborating in real-time!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {documents.map((doc) => (
                  <div key={doc._id} className="relative group/card">
                    <Link to={`/document/${doc._id}`} className="block h-40 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all flex flex-col">
                      <div className="flex items-start justify-between mb-auto">
                        <div className="bg-primary-50 p-2.5 rounded-xl text-primary-600">
                          <FileText size={24} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-lg line-clamp-2 leading-tight group-hover/card:text-primary-700 transition-colors mb-2">{doc.title}</h4>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          <span className="text-primary-500 opacity-0 group-hover/card:opacity-100 transition-opacity">Edit &rarr;</span>
                        </div>
                      </div>
                    </Link>
                    
                    {deleteConfirmId === doc._id ? (
                       <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border-2 border-red-100 z-30 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                          <p className="text-xs font-black text-red-600 uppercase mb-3 px-2">Delete this document?</p>
                          <div className="flex gap-2">
                             <button onClick={() => handleDeleteDocument(doc._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition">Delete</button>
                             <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition">Cancel</button>
                          </div>
                       </div>
                    ) : (
                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(doc._id); }}
                         className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover/card:opacity-100 p-2 hover:bg-red-50 rounded-lg z-20"
                       >
                         <Trash2 size={16} />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'kanban' && (
          <KanbanBoard workspaceId={workspaceId} />
        )}
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 w-[400px] z-40 hidden lg:block">
        <WorkspaceAiAssistant workspaceId={workspaceId} />
      </div>
    </div>
  );
};

export default WorkspaceView;
