/**
 * ============================================================================
 * ChatInput — Unified Message Input with @Mentions
 * ============================================================================
 *
 * Features:
 *  - MentionPopover for @mention autocomplete
 *  - Streaming-aware submit with auto-stop
 *  - Glass-glow themed styling
 *  - File attachments not supported by current AI model (text-only)
 *
 * @see {@link ../../ai-elements/prompt-input.tsx}
 * @see {@link ../../../hooks/use-mentions.ts}
 * ============================================================================
 */
'use client'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'
import { MentionPopover } from '@/components/features/assistant/mention-popover'
import { useMentions } from '@/hooks/use-mentions'
import type { ChatStatus } from 'ai'
import { Sparkles } from 'lucide-react'
import { useCallback, useRef, type ClipboardEventHandler } from 'react'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'

interface ChatInputProps {
  onSend: (
    content: string,
    files?: Array<{ url: string; mediaType: string; filename?: string }>,
    mentionedUserIds?: string[]
  ) => void
  status?: 'submitted' | 'streaming' | 'error' | 'awaiting_input' | 'ready'
  onStop?: () => void
}

export function ChatInput({
  onSend,
  status,
  onStop,
}: ChatInputProps) {
  const {
    mentionState,
    resolvedMentions,
    checkForMention,
    insertMention,
    clearMentions,
    dismissMentions,
  } = useMentions()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Quick-fill button handler — uses ref instead of DOM querySelector
  const handleQuickFill = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set
      nativeInputValueSetter?.call(textarea, 'Generate startup ideas based on my profile')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, [])

  // Textarea change handler — detect @mentions
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    textareaRef.current = textarea
    checkForMention(textarea.value, textarea.selectionStart)
  }, [checkForMention])

  // Textarea keydown handler
  // NOTE: MentionPopover uses a document-level keydown listener (non-capture phase).
  // This handler fires first (on the textarea), then the event bubbles to document
  // where MentionPopover handles Enter to confirm the selected mention.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    textareaRef.current = e.currentTarget
    if (mentionState.active && e.key === 'Enter' && !e.shiftKey) {
      // Prevent form submission so MentionPopover can handle the Enter key
      // to select the highlighted mention (via its document-level listener)
      e.preventDefault()
      return
    }
  }, [mentionState])

  // Handle mention selection
  const handleMentionSelect = useCallback((user: { id: string; name: string; headline: string | null; avatar_url: string | null }) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]')
    if (!textarea) return

    const { newText, newCursorPos } = insertMention(textarea.value, textarea.selectionStart, user)

    // Update textarea value via native setter to trigger React's controlled input
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set
    nativeInputValueSetter?.call(textarea, newText)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.selectionStart = newCursorPos
    textarea.selectionEnd = newCursorPos
  }, [insertMention])

  // Block image pastes (Ctrl+V of images) — current model doesn't support multimodal input
  // Non-image file pastes (text, JSON, etc.) are allowed through
  // TODO: Remove this limitation once AI model supports image input
  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault()
        return
      }
    }
  }, [])

  // Submit handler — text only, no file uploads (model doesn't support multimodal)
  const handleSubmit = useCallback(async (
    message: { text: string }
  ) => {
    if (!message.text.trim()) return

    // Get resolved mention user IDs
    const mentionIds = resolvedMentions.map(m => m.id)

    // Send message with mention IDs
    onSend(message.text.trim(), undefined, mentionIds.length > 0 ? mentionIds : undefined)

    // Reset mentions
    clearMentions()
  }, [onSend, resolvedMentions, clearMentions])

  return (
    <div className="relative">
      {/* Mention autocomplete popover — positioned above the form */}
      <MentionPopover
        mentionState={mentionState}
        onSelect={handleMentionSelect}
        onDismiss={dismissMentions}
      />

      <PromptInput
        onSubmit={handleSubmit}
        className={cn(
          'relative rounded-xl overflow-hidden',
          'focus-within:ring-1 focus-within:ring-primary transition-all',
          glass('card'),
        )}
        maxFiles={0}
      >
        {/* Main textarea */}
        <PromptInputTextarea
          placeholder="Ask for startup ideas, @mention connections, or general questions..."
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        {/* Footer with tools and submit */}
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              tooltip="Generate startup ideas"
              onClick={handleQuickFill}
            >
              <Sparkles className="size-4" />
            </PromptInputButton>
          </PromptInputTools>

          <PromptInputSubmit
            status={(status === 'awaiting_input' ? 'ready' : status ?? undefined) as ChatStatus}
            onStop={onStop}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
ChatInput.displayName = 'ChatInput'
