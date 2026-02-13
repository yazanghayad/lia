'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconMessageCircle,
  IconX,
  IconSend,
  IconRobot,
  IconUser,
  IconLoader2
} from '@tabler/icons-react';
import { useUser } from '@clerk/nextjs';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Hej! 👋 Jag är PraktikFinder AI-assistenten. Jag kan hjälpa dig med:\n\n• Hitta praktikplatser\n• Förstå matchningsprocessen\n• Svara på frågor om plattformen\n\nVad kan jag hjälpa dig med idag?',
    timestamp: new Date()
  }
];

export function AIChatBot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          data.message ||
          'Tyvärr kunde jag inte svara just nu. Försök igen senare.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Oj, något gick fel. Vänligen försök igen eller kontakta support om problemet kvarstår.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size='icon'
        className={cn(
          'fixed right-6 bottom-6 z-50 size-14 rounded-full shadow-lg transition-all hover:scale-105',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          isOpen && 'rotate-0'
        )}
      >
        {isOpen ? (
          <IconX className='size-6' />
        ) : (
          <IconMessageCircle className='size-6' />
        )}
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed right-6 bottom-24 z-50 flex w-[380px] flex-col overflow-hidden rounded-xl border shadow-xl transition-all duration-300',
          'bg-card text-card-foreground',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        )}
        style={{ height: '520px', maxHeight: 'calc(100vh - 140px)' }}
      >
        {/* Header */}
        <div className='bg-card flex items-center gap-3 border-b px-4 py-3'>
          <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
            <IconRobot className='text-primary size-5' />
          </div>
          <div className='flex-1'>
            <h3 className='leading-none font-semibold'>PraktikFinder AI</h3>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {isLoading ? 'Skriver...' : 'Alltid redo att hjälpa'}
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => setIsOpen(false)}
          >
            <IconX className='size-4' />
          </Button>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-hidden'>
          <ScrollArea className='h-full px-4'>
            <div className='flex flex-col gap-4 py-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <Avatar className='size-8 shrink-0'>
                    {message.role === 'assistant' ? (
                      <>
                        <AvatarFallback className='bg-primary/10'>
                          <IconRobot className='text-primary size-4' />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage
                          src={user?.imageUrl}
                          alt={user?.fullName || 'User'}
                        />
                        <AvatarFallback className='bg-secondary'>
                          <IconUser className='size-4' />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      message.role === 'assistant'
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                    )}
                  >
                    <p className='leading-relaxed whitespace-pre-wrap'>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className='flex gap-3'>
                  <Avatar className='size-8 shrink-0'>
                    <AvatarFallback className='bg-primary/10'>
                      <IconRobot className='text-primary size-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='bg-muted rounded-2xl rounded-tl-sm px-4 py-3'>
                    <div className='flex items-center gap-1'>
                      <span className='bg-foreground/40 size-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                      <span className='bg-foreground/40 size-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                      <span className='bg-foreground/40 size-2 animate-bounce rounded-full' />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className='bg-card shrink-0 border-t p-4'>
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <div className='relative flex-1'>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Skriv ett meddelande...'
                rows={1}
                className={cn(
                  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50',
                  'dark:bg-input/30 flex min-h-10 w-full resize-none rounded-xl border bg-transparent px-4 py-2.5 pr-12 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]',
                  'max-h-32'
                )}
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <Button
                type='submit'
                size='icon'
                variant='ghost'
                className='hover:bg-primary/10 absolute right-1 bottom-1 size-8 rounded-lg'
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <IconLoader2 className='size-4 animate-spin' />
                ) : (
                  <IconSend className='text-primary size-4' />
                )}
              </Button>
            </div>
          </form>
          <p className='text-muted-foreground mt-2 text-center text-[10px]'>
            AI kan göra misstag. Verifiera viktig information.
          </p>
        </div>
      </div>
    </>
  );
}
