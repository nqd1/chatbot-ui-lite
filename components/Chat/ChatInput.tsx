import { Message } from "@/types";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

interface Props {
  onSend: (message: Message) => void;
  disabled?: boolean;
}

export const ChatInput: FC<Props> = ({ onSend, disabled = false }) => {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setError(null);
    
    if (value.length > 4000) {
      setError("Tin nhắn không được vượt quá 4000 ký tự");
      return;
    }

    setContent(value);
  };

  const handleSend = () => {
    if (!content.trim() || disabled) {
      return;
    }

    // Check one more time to ensure the message is not too long
    if (content.length > 4000) {
      setError("Tin nhắn không được vượt quá 4000 ký tự");
      return;
    }

    onSend({ role: "user", content });
    setContent("");
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`min-h-[60px] max-h-[200px] w-full px-4 py-3 pr-14 rounded-lg border focus:outline-none focus:ring-1 ${
          error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#e24242]'
        } disabled:opacity-50 disabled:bg-gray-100 resize-none`}
        placeholder="Hãy nhập tin nhắn ở đây..."
        rows={1}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}

      <button
        className={`absolute right-2 bottom-2 p-2 rounded-lg ${disabled || !content.trim() ? 'text-gray-400 cursor-not-allowed' : 'text-[#e24242] hover:bg-[#fff0f0]'}`}
        onClick={handleSend}
        disabled={disabled || !content.trim() || !!error}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
};
