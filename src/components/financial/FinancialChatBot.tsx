import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader, X, Bot } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FinancialChatBotProps {
  financialData?: {
    month: string
    receita: { total: number; data: Array<{ description: string; value: number }> }
    despesas: { total: number; data: Array<{ description: string; value: number }> }
    result: number
  }
  onClose?: () => void
}

export default function FinancialChatBot({ financialData, onClose }: FinancialChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente de análise financeira. Faça-me perguntas sobre seus dados financeiros e vou ajudar com insights profundos.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call the AI analysis endpoint
      const response = await fetch('/api/financial/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          financialData,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao analisar dados')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.analysis,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro na análise. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full max-w-2xl border-2 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[500px] lg:h-[550px]" style={{ background: 'linear-gradient(135deg, #06162Bf5 0%, #C48A3F08 100%)', borderColor: '#C48A3F50' }}>
      {/* Header */}
      <CardHeader className="pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: '#C48A3F20', background: 'rgba(196, 138, 63, 0.05)' }}>
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="p-2 rounded-lg" style={{ background: '#C48A3F20' }}>
            <Bot className="h-5 w-5" style={{ color: '#C48A3F' }} />
          </div>
          <span style={{ color: '#C48A3F' }}>Análise Financeira IA</span>
        </CardTitle>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex-grow">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'text-white rounded-br-none'
                  : 'text-gray-100 rounded-bl-none'
              }`}
              style={{
                background: msg.role === 'user' ? '#C48A3F' : 'rgba(196, 138, 63, 0.15)',
              }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs mt-1 block opacity-70">
                {msg.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.15)' }}>
              <Loader className="h-4 w-4 animate-spin" style={{ color: '#C48A3F' }} />
              <span className="text-sm text-gray-400">Analisando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: '#C48A3F20', background: 'rgba(196, 138, 63, 0.02)' }}>
        <div className="flex gap-2">
          <Input
            placeholder="Faça uma pergunta sobre seus dados financeiros..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
            style={{ background: '#06162Bcc', borderColor: '#C48A3F40', color: 'white' }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4"
            style={{ background: '#C48A3F', color: '#000' }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tente: "Por que minhas despesas subiram?" ou "Qual foi minha margem este mês?"
        </p>
      </div>
    </Card>
  )
}
