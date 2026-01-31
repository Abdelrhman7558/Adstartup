
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function SupportChatbot() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAvatar, setShowAvatar] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handle scroll to hide avatar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setShowAvatar(false);
            } else {
                setShowAvatar(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !user) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue('');
        setLoading(true);

        try {
            // Send to Webhook
            const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook/Chatbot-adstartup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    message: newMessage.text,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Check for 'response' or 'message' in the returned JSON
                const aiText = data.response || data.message || data.output;

                if (aiText) {
                    const aiMessage: Message = {
                        id: Date.now().toString() + '_ai',
                        text: aiText,
                        sender: 'ai',
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, aiMessage]);
                }
            }

        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            <div
                className={`pointer-events-auto mb-4 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none hidden'
                    } ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
                {/* Header */}
                <div className={`p-4 rounded-t-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-gray-900' : 'bg-blue-600'
                    }`}>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/10 rounded-full">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">AdStartup Support</h3>
                            <p className="text-blue-100 text-xs">AI Assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className={`h-96 overflow-y-auto p-4 space-y-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                    {messages.length === 0 && (
                        <div className="text-center py-8 opacity-50">
                            <Bot className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">How can I help you today?</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : theme === 'dark'
                                        ? 'bg-gray-700 text-white rounded-tl-sm'
                                        : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className={`p-3 rounded-2xl rounded-tl-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-white shadow-sm'
                                }`}>
                                <span className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'
                    } rounded-b-2xl`}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || loading}
                            className={`p-2 rounded-xl transition-colors ${!inputValue.trim() || loading
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Button & Avatar */}
            <div className={`pointer-events-auto relative flex items-center gap-4 transition-all duration-500 ${isOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                }`}>
                {/* Robot Avatar & Message Bubble */}
                <div className={`flex items-center gap-3 transition-all duration-500 transform ${showAvatar ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'
                    }`}>
                    <div className={`px-4 py-2 rounded-2xl rounded-tr-sm shadow-lg border text-sm font-medium whitespace-nowrap ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-100 text-gray-900'
                        }`}>
                        How can I help you?
                    </div>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-xl border-2 border-white dark:border-gray-700 bg-white dark:bg-gray-800">
                            <img
                                src="/chatbot-robot.png"
                                alt="AI Support"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                </div>

                {/* Main Toggle Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 bg-red-600 hover:bg-red-700`}
                >
                    <img
                        src="/chatbot-icon.png"
                        alt="Chat"
                        className="w-8 h-8 object-contain"
                    />

                    <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20 duration-1000"></span>
                </button>
            </div>
        </div>
    );
}
