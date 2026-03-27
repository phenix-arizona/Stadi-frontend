import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

const SYSTEM_PROMPT = `You are Stadi's friendly AI learning assistant. Stadi is a Kenyan vocational skills platform where learners can learn practical skills and start earning money.

You help with:
- Course recommendations based on interests, county, and income goals
- Career guidance for Kenya's informal sector (Jua Kali economy)
- Information about specific skills, income potential, and tools needed
- General learning tips and motivation
- Platform navigation help

Be warm, encouraging, and practical. Use simple language. Reference Kenyan context (counties, M-Pesa, local industries, Jua Kali). Keep responses concise (2-4 sentences). Occasionally use Swahili words like "Hongera!" (Congratulations!) or "Karibu!" (Welcome!). If unsure, encourage learners to browse courses or contact support via WhatsApp.`;

export default function AIChatWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Karibu! 👋 I\'m Stadi\'s AI assistant. Ask me about courses, income potential, or which skills are in demand in your county!' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I had trouble responding. Please try again!';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Connection issue. Please try again or WhatsApp us at +254 700 000 000.' }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Which courses help me earn the most?',
    'Best skills for Kisumu area?',
    'How long to complete a course?',
    'Can I study offline?',
  ];

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up"
             style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-stadi-green px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Stadi AI Assistant</div>
                <div className="text-white/70 text-xs">Always here to help • Powered by Claude</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-stadi-green-light rounded-full flex items-center justify-center mr-2 shrink-0 mt-1">
                    <Bot size={13} className="text-stadi-green" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-stadi-green text-white rounded-br-sm'
                    : 'bg-gray-50 text-stadi-dark rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <Loader2 size={14} className="animate-spin text-stadi-green" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  className="text-xs bg-stadi-green-light text-stadi-green px-2.5 py-1.5 rounded-full hover:bg-stadi-green hover:text-white transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about courses or careers..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-stadi-green text-white p-2 rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-40 w-14 h-14 bg-stadi-green text-white rounded-full shadow-lg hover:bg-opacity-90 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI chat assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
