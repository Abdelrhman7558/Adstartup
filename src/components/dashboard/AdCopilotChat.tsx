import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AdCopilotChat() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'init',
                    role: 'assistant',
                    content: 'مرحباً بك! أنا مساعدك الإعلاني الشخصي (Ad Copilot). أستطيع مساعدتك في تحليل أداء حملاتك أو توجيهك في إنشاء حملة جديدة خطوة بخطوة. كيف يمكنني مساعدتك اليوم؟',
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const userMsg = input.trim();
        setInput('');

        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsg,
            timestamp: new Date()
        };

        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            if (!accessToken) throw new Error('Session expired');

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const openAiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${supabaseUrl}/functions/v1/ad-ops-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ messages: openAiMessages })
            });

            if (!response.ok) {
                let errText = await response.text();
                throw new Error(`Server ERROR: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            setMessages([
                ...newMessages,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply.content,
                    timestamp: new Date()
                }
            ]);

        } catch (error: any) {
            console.error('Chat Error:', error);
            setMessages([
                ...newMessages,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.',
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Box */}
            {isOpen && (
                <div 
                    className={`mb-4 w-96 h-[32rem] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all transform origin-bottom-right ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    {/* Header */}
                    <div className={`p-4 border-b flex items-center justify-between shadow-sm ${
                        theme === 'dark' ? 'bg-blue-900/50 border-gray-700' : 'bg-blue-50 border-gray-200'
                    }`}>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ad Copilot</h3>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Online</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div 
                        className={`flex-1 overflow-y-auto p-4 space-y-4`}
                        dir="rtl"
                    >
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : theme === 'dark'
                                                ? 'bg-gray-700 text-white rounded-tl-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${
                                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-end" dir="rtl">
                                <div className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-3 rounded-2xl rounded-tl-sm ${
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                    <div className="flex space-x-1 rtl:space-x-reverse">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                        <form onSubmit={handleSend} className="flex space-x-2 rtl:space-x-reverse" dir="rtl">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                                    theme === 'dark' 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                                }`}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className={`p-3 rounded-xl flex items-center justify-center transition-all shadow-md ${
                                    input.trim() && !isLoading
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
                                        : theme === 'dark'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
                    isOpen 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white animate-bounce-slow'
                }`}
                style={{ 
                    animation: !isOpen ? 'bounce 2s infinite' : 'none' 
                }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
            {!isOpen && (
               <div className="absolute bottom-16 right-0 mb-2 mr-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg shadow-lg border border-blue-100 dark:border-gray-700 text-sm font-semibold tracking-wide flex items-center space-x-2 animate-pulse whitespace-nowrap">
                   <span dir="rtl">تحدث مع الذكاء الاصطناعي!</span>
               </div>
            )}
        </div>
    );
}
