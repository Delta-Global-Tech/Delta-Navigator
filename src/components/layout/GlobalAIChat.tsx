import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader, X, Bot, Minimize2, Maximize2, MessageSquare } from 'lucide-react'
import { usePageContext, PageContextData } from '@/hooks/usePageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface GlobalAIChatProps {
  context?: {
    page?: string
    data?: Record<string, any>
  }
}

export default function GlobalAIChat({ context }: GlobalAIChatProps) {
  const pageContext = usePageContext(context?.data)
  const isFinancialPage = pageContext.isFinancialPage
  
  // Mensagem inicial dinâmica baseada na página - ANNOUNCES PAGE FIRST as per user requirement
  const initialMessage = `� **Você está em: ${pageContext.pageName}**

✨ Dados disponíveis nesta página:
${pageContext.availableData.map((item) => `  • ${item}`).join('\n')}

Sou seu assistente IA e posso responder perguntas específicas sobre os dados acima. O que gostaria de saber?`

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const GOLD_COLOR = '#C48A3F'
  const DARK_BG = '#06162B'

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
      // Call the AI analysis endpoint with full page context
      const response = await fetch('/api/financial/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          pageContext: {
            page: pageContext.page,
            pageName: pageContext.pageName,
            description: pageContext.description,
            availableData: pageContext.availableData,
            isFinancialPage: pageContext.isFinancialPage,
            isAdminPage: pageContext.isAdminPage,
            timestamp: new Date().toISOString(),
          },
          financialData: context?.data || pageContext.dataContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao processar')
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
        content: '❌ Desculpe, ocorreu um erro. Tente novamente ou reformule sua pergunta.',
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

  // Botão Flutuante (quando fechado)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-110 animate-bounce"
        style={{
          background: `linear-gradient(135deg, ${GOLD_COLOR}, #d4a574)`,
          color: '#000',
        }}
        title="Abrir Assistente IA"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  // Chat Aberto (minimizado)
  if (isMinimized) {
    return (
      <div className="fixed bottom-8 right-8 z-40">
        <Card className="w-80 border-2 backdrop-blur-xl shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, ${GOLD_COLOR}08 100%)`, borderColor: `${GOLD_COLOR}50` }}>
          <CardHeader className="pb-3 flex items-center justify-between flex-row cursor-pointer hover:bg-opacity-80 transition" onClick={() => setIsMinimized(false)} style={{ borderColor: `${GOLD_COLOR}20`, background: 'rgba(196, 138, 63, 0.05)' }}>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Bot className="h-4 w-4" style={{ color: GOLD_COLOR }} />
              <span style={{ color: GOLD_COLOR }}>Assistente IA</span>
            </CardTitle>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-700 rounded transition">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Chat Totalmente Aberto
  return (
    <div className="fixed bottom-8 right-8 z-40 animate-in fade-in slide-in-from-right-4 duration-300">
      <Card className="w-96 lg:w-96 border-2 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[550px] lg:h-[600px]" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, ${GOLD_COLOR}08 100%)`, borderColor: `${GOLD_COLOR}50` }}>
        {/* Header */}
        <CardHeader className="pb-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: `${GOLD_COLOR}20`, background: 'rgba(196, 138, 63, 0.05)' }}>
          <CardTitle className="flex items-center gap-3 text-base font-bold">
            <div className="p-2 rounded-lg" style={{ background: `${GOLD_COLOR}20` }}>
              <Bot className="h-5 w-5" style={{ color: GOLD_COLOR }} />
            </div>
            <span style={{ color: GOLD_COLOR }}>Assistente IA</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-700 rounded-lg transition"
            >
              <Minimize2 className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-700 rounded-lg transition"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 flex-grow">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-none'
                    : 'text-gray-100 rounded-bl-none'
                }`}
                style={{
                  background: msg.role === 'user' ? GOLD_COLOR : `rgba(196, 138, 63, 0.15)`,
                }}
              >
                <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
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
                <Loader className="h-4 w-4 animate-spin" style={{ color: GOLD_COLOR }} />
                <span className="text-sm text-gray-400">Analisando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t space-y-3 flex-shrink-0" style={{ borderColor: `${GOLD_COLOR}20`, background: 'rgba(196, 138, 63, 0.02)' }}>
          {/* Quick suggestions */}
          {isFinancialPage && messages.length <= 2 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 px-1">💡 Sugestões rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {['Qual minha maior despesa?', 'Como está meu resultado?', 'Qual foi minha receita?', 'Como reduzir custos?'].map((suggestion, i) => (
                  <Button
                    key={i}
                    onClick={() => {
                      setInput(suggestion)
                      setTimeout(handleSendMessage, 100)
                    }}
                    className="text-xs h-auto py-2 px-2 text-left"
                    style={{
                      background: `${GOLD_COLOR}20`,
                      color: GOLD_COLOR,
                      border: `1px solid ${GOLD_COLOR}40`,
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 text-sm"
              style={{ background: `${DARK_BG}cc`, borderColor: `${GOLD_COLOR}40`, color: 'white' }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-3 py-2"
              style={{ background: GOLD_COLOR, color: '#000' }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Faça perguntas sobre qualquer página</p>
        </div>
      </Card>
    </div>
  )
}
