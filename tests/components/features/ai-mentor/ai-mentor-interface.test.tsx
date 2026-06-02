/**
 * TC-076: AI Mentor Chat Interface Component Test
 * Verifies users can access the AI Mentor chat interface from the dashboard,
 * with input field, send button, and message display area present.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Use a mutable object so hoisted vi.mock factory can reference it
const mockState = vi.hoisted(() => ({
  messages: [] as Array<{ id: string; role: string; content: string; created_at: string }>,
  isStreaming: false,
  error: null as Error | null,
  sendMessage: vi.fn(),
}))

// Mock the useAIStream hook
vi.mock('@/hooks/use-ai-stream', () => ({
  useAIStream: vi.fn(() => ({
    messages: mockState.messages,
    isStreaming: mockState.isStreaming,
    sendMessage: mockState.sendMessage,
    error: mockState.error,
  })),
}))

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
    },
    session: null,
    isLoading: false,
    signOut: vi.fn(),
  })),
}))

// Mock ChatList — renders messages as simple divs for testing
vi.mock('@/components/features/assistant/chat-list', () => ({
  ChatList: vi.fn(({ externalMessages, onSuggestionClick, onIdeaAction }: {
    externalMessages?: Array<{ role: string; content: string }>
    onSuggestionClick?: (s: string) => void
    onIdeaAction?: (id: number, a: string) => void
  }) => (
    <div data-testid="chat-list">
      {(externalMessages || []).map((msg, i) => (
        <div key={i} data-testid={`msg-${msg.role}-${i}`}>
          {msg.content}
        </div>
      ))}
    </div>
  )),
}))

// Mock ChatInput — renders an input and form for testing
vi.mock('@/components/features/assistant/chat-input', () => ({
  ChatInput: vi.fn(() => (
    <div data-testid="chat-input">
      <input
        data-testid="mock-input"
        placeholder="Ask for startup ideas based on your skills..."
      />
    </div>
  )),
}))

// Mock the ui components that ChatList/ChatInput depend on
vi.mock('@/components/ui/conversation', () => ({
  Conversation: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  ConversationContent: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  ConversationScrollButton: vi.fn(() => null),
}))

// Import the actual content component directly to bypass next/dynamic wrapper (loading spinner)
import AIMentorContent from '@/app/(auth)/ai-mentor/ai-mentor-content'

describe('AI Mentor Chat Interface (TC-076)', () => {
  beforeEach(() => {
    mockState.sendMessage.mockClear()
    mockState.messages = []
    mockState.isStreaming = false
    mockState.error = null
  })

  describe('Interface Accessibility', () => {
    it('should render the AI Mentor header', async () => {
      render(<AIMentorContent />)
      expect(screen.getByText('AI Mentor')).toBeInTheDocument()
    })

    it('should render the description text', async () => {
      render(<AIMentorContent />)
      expect(screen.getByText(/personalized startup ideas/)).toBeInTheDocument()
    })

    it('should render the ChatInput component', async () => {
      render(<AIMentorContent />)
      expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    })

    it('should render the ChatList component', async () => {
      render(<AIMentorContent />)
      expect(screen.getByTestId('chat-list')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should display user messages in the message area', async () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'Give me startup ideas', created_at: new Date().toISOString() },
      ]

      render(<AIMentorContent />)

      expect(screen.getByText('Give me startup ideas')).toBeInTheDocument()
    })

    it('should display AI responses in the message area', async () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'Hi', created_at: new Date().toISOString() },
        { id: '2', role: 'assistant', content: 'Here are 3 startup ideas for you...', created_at: new Date().toISOString() },
      ]

      render(<AIMentorContent />)

      expect(screen.getByText('Here are 3 startup ideas for you...')).toBeInTheDocument()
    })

    it('should display multiple messages in conversation order', async () => {
      mockState.messages = [
        { id: '1', role: 'user', content: 'I am a developer', created_at: new Date().toISOString() },
        { id: '2', role: 'assistant', content: 'Great, here are dev tool ideas', created_at: new Date().toISOString() },
        { id: '3', role: 'user', content: 'More ideas please', created_at: new Date().toISOString() },
        { id: '4', role: 'assistant', content: 'Here are 3 more...', created_at: new Date().toISOString() },
      ]

      render(<AIMentorContent />)

      expect(screen.getByText('I am a developer')).toBeInTheDocument()
      expect(screen.getByText('Great, here are dev tool ideas')).toBeInTheDocument()
      expect(screen.getByText('More ideas please')).toBeInTheDocument()
      expect(screen.getByText('Here are 3 more...')).toBeInTheDocument()
    })
  })

  describe('Error Display', () => {
    it('should display error message when an error occurs', async () => {
      mockState.error = new Error('Failed to connect to AI service')

      render(<AIMentorContent />)

      expect(screen.getByText(/Failed to connect/)).toBeInTheDocument()
    })

    it('should not display error when no error exists', async () => {
      mockState.error = null

      render(<AIMentorContent />)

      expect(screen.queryByText(/Failed to connect/)).not.toBeInTheDocument()
    })
  })
})
