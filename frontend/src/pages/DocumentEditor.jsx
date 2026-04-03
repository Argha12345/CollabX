import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Sparkles } from 'lucide-react';

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose outline-none min-h-full max-w-none text-gray-800'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (socket) {
        socket.emit('send-changes', id, html);
      }
    },
  });

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDocument(data);
        if (editor && data.content && typeof data.content === 'string') {
          editor.commands.setContent(data.content);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();

    if (socket) {
      socket.emit('join-document', id);
      
      const receiveHandler = (html) => {
        if (editor && editor.getHTML() !== html) {
          const currentSelection = editor.state.selection;
          editor.commands.setContent(html);
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
      setAiSuggestion('API error. Set OPENAI_API_KEY in backend .env to test mock suggestions or actual OpenAI API.');
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
          <button onClick={() => navigate(-1)} className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">{document.title}</h2>
        </div>
        <div className="flex items-center space-x-4">
           {socket?.connected ? (
             <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium border border-green-200">Live Synced</span>
           ) : (
             <span className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium border border-red-200">Disconnected</span>
           )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
          <div className="bg-white w-full max-w-4xl shadow-sm border border-gray-200 min-h-[800px] p-8 md:p-12 mb-12">
            <EditorContent editor={editor} className="min-h-full" />
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
            <Sparkles className="text-primary-500" size={20} />
            <h3 className="font-bold text-gray-800">AI Assistant</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
