import React, { useEffect, useRef } from 'react';
import styles from './chatPanel.module.css';

interface Message {
  id: string;
  text: string;
  choices?: string[];
}

interface ChatPanelProps {
  messages: Message[];
  onAction: (choice: string) => void;
  disabled: boolean;
}

export default function ChatPanel({ messages, onAction, disabled }: ChatPanelProps) {
  const latestMessage = messages[messages.length - 1];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>Campaign History</h2>
      
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.message}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {latestMessage?.choices && (
        <div className={styles.choicesContainer}>
          {latestMessage.choices.map((choice, idx) => (
            <button
              key={choice}
              onClick={() => onAction(choice)}
              disabled={disabled}
              className={styles.choiceButton}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}