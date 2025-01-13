'use client'

import { useState } from 'react'
import styles from './Chat.module.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      console.log('API response:', data) // Log the entire response

      // Check if the response contains role and content directly
      if (data.role && data.content) {
        // Add assistant message
        setMessages(prev => [...prev, {
          role: data.role,
          content: data.content,
          id: Date.now().toString()
        }])
      } else {
        console.error('Unexpected response structure:', data)
        throw new Error('Unexpected response structure')
      }
    } catch (error) {
      console.error('Error:', error)
      // Handle error appropriately
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.chatContainer}>
        <div className={styles.messageList}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.role === 'assistant' ? styles.assistant : styles.user
              }`}
            >
              <div className={styles.messageContent}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className={styles.input}
          />
          <button type="submit" disabled={isLoading} className={styles.sendButton}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}