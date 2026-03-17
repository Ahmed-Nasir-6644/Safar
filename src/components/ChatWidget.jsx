import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { PYTHON_API_URL } from '../config/apiConfig';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: 'Hello! I am the MetroMate assistant. How can I help you today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Auto-scroll to bottom when new messages are added
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        // Clear input immediately
        setInput('');

        // Set loading state
        setIsLoading(true);

        try {
            const response = await fetch(`${PYTHON_API_URL}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ocr_result: userMessage
                })
            });

            const data = await response.json();

            if (data.success && data.prediction) {
                // Add bot response to chat
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: data.prediction
                }]);
            } else {
                // Handle error from backend
                const errorMessage = data.error
                    ? `Sorry, I am having trouble connecting right now. ${data.error}`
                    : 'Sorry, I couldn\'t process your request. Please try again.';

                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: errorMessage
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I am having trouble connecting right now. Please check your connection and try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <>
            {/* Chat Widget Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-accent-orange text-white rounded-full shadow-2xl hover:bg-orange-600 transition-all duration-300 flex items-center justify-center z-[9999] hover:scale-110 group"
                    aria-label="Open chat"
                >
                    <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-accent-orange to-orange-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">MetroMate Support</h3>
                                <p className="text-xs text-orange-100">Always here to help</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                            >
                                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-300 text-gray-700'
                                        }`}>
                                        {message.role === 'user' ? (
                                            <User className="w-5 h-5" />
                                        ) : (
                                            <Bot className="w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                                            ? 'bg-accent-orange text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex gap-2 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
                                        <div className="flex gap-1 items-center">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auto-scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="w-12 h-12 bg-accent-orange text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:shadow-none"
                                aria-label="Send message"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Press Enter to send • Powered by MetroMate AI
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
