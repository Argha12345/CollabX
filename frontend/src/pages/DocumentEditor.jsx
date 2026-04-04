import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { ArrowLeft, Sparkles, Bold, Italic, Underline as UnderlineIcon, Highlighter, Save, History } from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
});

const EditorToolbar = ({ editor, onSave, isSaving }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 z-10 sticky top-0 shadow-sm rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Underline"
      >
        <UnderlineIcon size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-2 rounded hover:bg-yellow-100 transition-colors ${editor.isActive('highlight') ? 'bg-yellow-200 text-yellow-900 border border-yellow-300' : 'text-gray-600 border border-transparent'}`}
        title="Highlight"
      >
        <Highlighter size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      
      <button
        onClick={() => editor.chain().focus().setFontSize('12px').run()}
        className={`px-3 py-1 font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center ${editor.isActive('textStyle', { fontSize: '12px' }) ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Small Text"
      >
        <span className="text-xs">A</span>
      </button>
      <button
        onClick={() => editor.chain().focus().unsetFontSize().run()}
        className={`px-3 py-1 font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center ${!editor.isActive('textStyle', { fontSize: '12px' }) && !editor.isActive('textStyle', { fontSize: '24px' }) && !editor.isActive('textStyle', { fontSize: '32px' }) ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Normal Text"
      >
        <span className="text-base">A</span>
      </button>
      <button
        onClick={() => editor.chain().focus().setFontSize('24px').run()}
        className={`px-3 py-1 font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center ${editor.isActive('textStyle', { fontSize: '24px' }) ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Large Text"
      >
        <span className="text-xl">A</span>
      </button>
      <button
        onClick={() => editor.chain().focus().setFontSize('32px').run()}
        className={`px-3 py-1 font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center ${editor.isActive('textStyle', { fontSize: '32px' }) ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'text-gray-600 border border-transparent'}`}
        title="Huge Text"
      >
        <span className="text-2xl">A</span>
      </button>

      <div className="flex-1"></div>
      
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded shadow-sm transition-colors disabled:opacity-50 font-medium text-sm active:transform active:scale-95"
      >
        <Save size={16} />
        {isSaving ? 'Saving...' : 'Save Document'}
      </button>
    </div>
  );
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState('ai');
  const [auditLogs, setAuditLogs] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/documents/${id}/logs`);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch(err) {
      setAuditLogs([]);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Underline, 
      TextStyle, 
      FontSize, 
      Highlight.configure({ multicolor: false })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl outline-none min-h-full max-w-none text-gray-800'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (socket) {
        socket.emit('send-changes', id, html, user?.name);
      }
    },
  });

  const saveDocument = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await api.put(`/documents/${id}`, {
        title: document.title,
        content: editor.getHTML()
      });
      fetchLogs();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDocument(data);
        if (editor && data.content && typeof data.content === 'string') {
          editor.commands.setContent(data.content, false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
    fetchLogs();

    if (socket) {
      socket.emit('join-document', id);
      
      const receiveHandler = (html, userName) => {
        if (userName && userName !== user?.name) {
           setTypingUser(userName);
           if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
           typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
        }
        
        if (editor && editor.getHTML() !== html) {
          const currentSelection = editor.state.selection;
          editor.commands.setContent(html, false);
          try {
            editor.commands.setTextSelection(currentSelection);
          } catch (e) {}  
        }
      };

      socket.on('receive-changes', receiveHandler);
      return () => socket.off('receive-changes', receiveHandler);
    }
  }, [id, socket, editor]);

  const handleAiSuggest = async () => {
    if (!editor) return;
    setIsAiLoading(true);
    let selectedText = '';
    
    try {
      selectedText = editor.state.doc.textBetween(
        editor.state.selection.from, 
        editor.state.selection.to, 
        ' '
      );
    } catch (e) {
      selectedText = '';
    }
    
    const context = editor.getText().substring(0, 500);

    try {
      const { data } = await api.post('/ai/suggest', { 
        prompt: selectedText || 'Continue this text naturally', 
        context 
      });
      setAiSuggestion(data.suggestion);
    } catch (err) {
      setAiSuggestion(err.response?.data?.message || 'API error while generating suggestion.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertSuggestion = () => {
    if (editor && aiSuggestion) {
      editor.chain().focus().insertContent(` ${aiSuggestion} `).run();
      setAiSuggestion('');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading document...</div>;
  if (!document) return <div className="p-8 text-center text-red-500">Document not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <input 
            type="text"
            className="text-xl font-bold text-gray-800 bg-transparent border-none border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 px-2 py-1 outline-none transition w-64 md:w-96 placeholder-gray-400"
            value={document.title}
            onChange={(e) => setDocument({...document, title: e.target.value})}
            onBlur={saveDocument}
            placeholder="Document Title"
          />
        </div>
        <div className="flex items-center space-x-4">
           {socket?.connected ? (
             <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium border border-green-200 hover:bg-green-100 transition-colors cursor-default">
               Live Synced
             </span>
           ) : (
             <span className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium border border-red-200">Disconnected</span>
           )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-gray-100 cursor-text relative" onClick={() => editor?.chain().focus().run()}>
          {typingUser && (
             <div className="absolute top-4 right-8 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold z-20 flex items-center shadow-lg transition-opacity animate-in fade-in duration-300">
               <span className="mr-2 animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
               {typingUser} is typing...
             </div>
          )}
          
          <div 
            className="flex flex-col bg-white w-full max-w-4xl shadow-md border border-gray-200 rounded-lg min-h-[800px] mb-12 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <EditorToolbar editor={editor} onSave={saveDocument} isSaving={isSaving} />
            <div className="p-8 md:p-12 flex-1 cursor-text" onClick={() => editor?.chain().focus().run()}>
              <EditorContent editor={editor} className="min-h-full h-full" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
             <button 
               className={`flex-1 py-3 text-sm flex justify-center items-center space-x-2 transition ${activeTab === 'ai' ? 'font-bold text-primary-600 border-b-2 border-primary-600 bg-white' : 'font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
               onClick={() => setActiveTab('ai')}
             >
               <Sparkles size={16} /> <span>AI Assistant</span>
             </button>
             <button 
               className={`flex-1 py-3 text-sm flex justify-center items-center space-x-2 transition ${activeTab === 'history' ? 'font-bold text-primary-600 border-b-2 border-primary-600 bg-white' : 'font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
               onClick={() => setActiveTab('history')}
             >
               <History size={16} /> <span>Activity</span>
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'ai' ? (
              <div className="p-5 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm text-gray-500 leading-relaxed">Highlight text in the document and ask AI to expand, or just ask it to continue drafting.</p>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isAiLoading}
                  className="bg-primary-600 text-white px-4 py-2.5 rounded-md shadow-sm hover:bg-primary-700 transition disabled:opacity-50 font-medium"
                >
                  {isAiLoading ? 'Thinking...' : 'Generate Suggestion'}
                </button>

                {aiSuggestion && (
                  <div className="mt-6 border border-primary-200 bg-primary-50 p-4 rounded-lg flex flex-col shadow-sm">
                    <h4 className="text-xs font-bold text-primary-600 mb-2 uppercase tracking-wide">Suggestion output</h4>
                    <p className="text-sm text-gray-800 mb-5 whitespace-pre-wrap leading-relaxed">{aiSuggestion}</p>
                    <div className="flex space-x-3 mt-auto">
                      <button 
                        onClick={insertSuggestion}
                        className="flex-1 bg-white border border-primary-300 text-primary-700 px-3 py-1.5 rounded text-sm hover:bg-primary-50 transition font-medium shadow-sm"
                      >
                        Insert
                      </button>
                      <button 
                        onClick={() => setAiSuggestion('')}
                        className="flex-1 bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition shadow-sm"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 flex flex-col animate-in fade-in duration-200">
                 <h4 className="text-xs font-bold text-gray-500 mb-5 uppercase tracking-widest text-center border-b border-gray-100 pb-3">Version History</h4>
                 {auditLogs.length === 0 ? (
                    <div className="text-center py-10 opacity-70">
                      <History size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No edits recorded yet.</p>
                    </div>
                 ) : (
                    <ul className="space-y-5 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pt-2">
                      {auditLogs.map((log, i) => (
                         <li key={log.id} className="relative flex items-start space-x-3">
                           <div className="relative flex items-center justify-center w-3 h-3 mt-1.5 bg-primary-50 rounded-full ring-4 ring-white z-10 border border-primary-200 shadow-sm">
                             <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                           </div>
                           <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm relative w-full">
                             <div className="absolute top-3 -left-1.5 w-3 h-3 bg-gray-50 border-t border-l border-gray-100 transform -rotate-45 z-0"></div>
                             <p className="text-sm text-gray-700 relative z-10">
                               <span className="font-bold text-primary-700">{log?.userName || 'User'}</span> {log?.action?.toLowerCase() || 'updated document'}
                             </p>
                             <time className="text-[11px] font-medium text-gray-400 mt-1 block">
                               {log?.createdAt ? new Date(log.createdAt).toLocaleString(undefined, {
                                 month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                               }) : 'Just now'}
                             </time>
                           </div>
                         </li>
                      ))}
                    </ul>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
