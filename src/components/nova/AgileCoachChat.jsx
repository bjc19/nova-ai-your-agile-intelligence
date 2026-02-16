import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AgileCoachChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const user = await base44.auth.me();
        const convo = await base44.agents.createConversation({
          agent_name: 'AgileCoachatbot',
          metadata: {
            name: `Chat avec ${user?.full_name || 'Admin'}`,
            description: 'Conversation avec le Coach Agile Nova'
          }
        });
        setConversation(convo);
        setMessages(convo.messages || []);
      } catch (error) {
        console.error('Error initializing conversation:', error);
      } finally {
        setInitializing(false);
      }
    };

    initConversation();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        setMessages(data.messages || []);
      }
    );

    return unsubscribe;
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversation) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
      // Messages will be updated via subscription
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-slate-600">Initialisation du Coach Agile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-screen flex flex-col bg-slate-50 rounded-xl border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">Nova - Coach Agile</h2>
            <p className="text-blue-100 text-sm">Analysez la performance de votre équipe</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Commencez une conversation avec votre Coach Agile</p>
              <p className="text-sm mt-2">Posez vos questions sur la performance de votre équipe</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg rounded-bl-none">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-6 rounded-b-xl">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Posez votre question au Coach Agile..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}