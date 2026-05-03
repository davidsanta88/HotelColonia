import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const QUICK_PROMPTS = [
    '¿Cuántas habitaciones disponibles hay?',
    '¿Quiénes están hospedados ahora?',
    'Resumen del estado del hotel',
    '¿Cuáles son los ingresos de hoy?',
    '¿Hay reservas para hoy?',
    '¿Hay solicitudes pendientes?',
];

const ChatBot = () => {
    const { hotelConfig } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hola, soy tu asistente hotelero 👋\nPuedo consultarte información en tiempo real sobre habitaciones, huéspedes, reservas, ingresos y más.\n¿En qué te ayudo?`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showQuick, setShowQuick] = useState(true);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const sendMessage = async (text) => {
        const userText = text || input.trim();
        if (!userText || loading) return;

        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInput('');
        setShowQuick(false);
        setLoading(true);

        try {
            const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
            const res = await api.post('/chatbot/message', {
                messages: apiMessages,
                hotelNombre: hotelConfig?.nombre || 'Hotel'
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Error al conectar con el asistente. Verifica la configuración del servidor.';
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `Chat reiniciado. ¿En qué te ayudo?`
        }]);
        setShowQuick(true);
    };

    const formatContent = (text) => {
        return text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Asistente IA"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    style={{ height: '520px' }}>

                    {/* Header */}
                    <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 rounded-full p-1">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm leading-tight">Asistente Hotelero</p>
                                <p className="text-blue-100 text-xs">{hotelConfig?.nombre || 'Hotel'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearChat}
                                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                                title="Limpiar chat"
                            >
                                <Trash2 size={15} />
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                        <Bot size={14} className="text-blue-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                                    }`}
                                >
                                    {formatContent(msg.content)}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                                    <Bot size={14} className="text-blue-600" />
                                </div>
                                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                                    <Loader2 size={14} className="text-blue-500 animate-spin" />
                                    <span className="text-xs text-gray-400">Consultando datos...</span>
                                </div>
                            </div>
                        )}

                        {/* Quick prompts */}
                        {showQuick && !loading && messages.length <= 1 && (
                            <div className="space-y-1.5 mt-2">
                                <p className="text-xs text-gray-400 px-1">Preguntas frecuentes:</p>
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(prompt)}
                                        className="w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-100 bg-white px-3 py-2">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe una pregunta..."
                                rows={1}
                                disabled={loading}
                                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50 max-h-24"
                                style={{ minHeight: '38px' }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl p-2 transition-colors flex-shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 text-center">Enter para enviar · Shift+Enter nueva línea</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;
