/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Thêm tin nhắn chào hỏi khi lần đầu mở
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Xin chào! Mình là trợ lý AI của cửa hàng sách Tiến Thọ. Bạn cần tìm sách gì hay cần tư vấn gì không?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử tin nhắn để gửi
      const history = messages
        .filter((msg, index) => !(index === 0 && msg.sender === 'bot' && msg.text.includes('Xin chào! Mình là trợ lý')))
        .map(msg => ({
          role: msg.sender === 'bot' ? 'model' : 'user',
          text: msg.text
        }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.post('/Chatbot/Ask', {
        message: userMsg.text,
        history: history
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.response || 'Xin lỗi, mình đang gặp lỗi phản hồi.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Lỗi kết nối đến máy chủ AI, vui lòng thử lại sau!',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Nút mở Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className={`bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg transition-transform transform ${isOpen ? 'scale-0' : 'scale-100'}`}
          title="Chat với chúng tôi"
        >
          <MessageCircle size={28} />
        </button>
      </div>

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300" style={{ height: '550px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Tư Vấn Sách</h3>
                <div className="text-[11px] text-orange-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 block"></span> Đang hoạt động
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Phần nội dung Chat */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'} gap-2`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex self-start gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="text-orange-500 animate-spin" />
                  <span className="text-xs text-slate-400">Đang trả lời...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Khung Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu hỏi tại đây..."
                disabled={isLoading}
                className="flex-1 text-sm border border-slate-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="flex-shrink-0 bg-orange-500 text-white p-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className="translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
