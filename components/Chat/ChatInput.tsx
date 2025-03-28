import { Message } from "@/types";
import { IconArrowUp } from "@tabler/icons-react";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

interface Props {
  onSend: (message: Message) => void;
  disabled?: boolean;
}

export const ChatInput: FC<Props> = ({ onSend, disabled = false }) => {
  const [content, setContent] = useState<string>();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 4000) {
      alert("Message limit is 4000 characters");
      return;
    }

    setContent(value);
  };

  const handleSend = () => {
    if (!content || disabled) {
      return;
    }
    onSend({ role: "user", content });
    setContent("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`min-h-[44px] rounded-lg pl-4 pr-12 py-2 w-full focus:outline-none focus:ring-1 focus:ring-neutral-300 border-2 border-neutral-200 ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
        style={{ resize: "none" }}
        placeholder={disabled ? "Đang xử lý tin nhắn..." : "Nhập tin nhắn..."}
        value={content}
        rows={1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <button 
        onClick={() => handleSend()}
        disabled={disabled}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      >
        <IconArrowUp className="absolute right-2 bottom-3 h-8 w-8 hover:cursor-pointer rounded-full p-1 bg-[#e24242] text-white hover:opacity-80" />
      </button>
    </div>
  );
};
