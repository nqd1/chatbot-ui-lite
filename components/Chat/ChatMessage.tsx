import { Message } from "@/types";
import { FC, useEffect, useState, useMemo } from "react";
import { CodeBlock } from "./CodeBlock";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: FC<Props> = ({ message, isStreaming = false }) => {
  const [displayedContent, setDisplayedContent] = useState<string>(message.content || "");
  const [isNew, setIsNew] = useState<boolean>(true);

  // Update displayed content when the message content changes (during streaming)
  useEffect(() => {
    setDisplayedContent(message.content || "");
  }, [message.content]);

  // Reset the "new" state after animation completes
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsNew(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Format the message content with proper handling of code blocks
  const formattedContent = useMemo(() => {
    if (!displayedContent) return [<div key="empty"></div>];

    // Function to safely handle code block parsing
    const parseCodeBlocks = (text: string) => {
      // Handle case where there are no code blocks
      if (!text.includes("```")) {
        return [
          <div key="text-only" className="mb-2 last:mb-0 whitespace-pre-wrap">
            {text}
          </div>
        ];
      }

      // Split by code block markers
      const segments = text.split(/(```(?:.*?)```)/s);
      
      return segments.map((segment, index) => {
        // Check if this segment is a code block
        if (segment.startsWith("```") && segment.endsWith("```")) {
          // Extract the code block content
          const codeContent = segment.slice(3, -3);
          
          // Check if there's a language specifier in the first line
          const firstLineBreak = codeContent.indexOf('\n');
          
          if (firstLineBreak === -1) {
            // Single line code block with no language
            return (
              <div key={`code-${index}`} className="mb-4 last:mb-0">
                <CodeBlock language="plaintext" value={codeContent.trim()} />
              </div>
            );
          }
          
          const firstLine = codeContent.slice(0, firstLineBreak).trim();
          const restOfCode = codeContent.slice(firstLineBreak + 1);
          
          return (
            <div key={`code-${index}`} className="mb-4 last:mb-0">
              <CodeBlock language={firstLine || "plaintext"} value={restOfCode.trim()} />
            </div>
          );
        } else if (segment.trim()) {
          // Regular text
          return (
            <div key={`text-${index}`} className="mb-2 last:mb-0 whitespace-pre-wrap">
              {segment}
            </div>
          );
        }
        
        return null;
      }).filter(Boolean);
    };

    return parseCodeBlocks(displayedContent);
  }, [displayedContent]);

  return (
    <div className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"} mb-3 ${isNew ? 'message-enter' : ''}`}>
      <div
        className={`relative py-3 px-4 rounded-lg max-w-[90%] sm:max-w-[80%] ${
          message.role === "assistant"
            ? "bg-white text-neutral-900 shadow-sm rounded-tl-none"
            : "bg-[#e24242] text-white rounded-tr-none"
        } ${isStreaming ? 'streaming-message' : ''}`}
      >
        <div className={`prose ${message.role === "assistant" ? "prose-neutral" : "prose-invert"} max-w-none`}>
          {formattedContent}
        </div>
        
        {isStreaming && (
          <div className="flex mt-2">
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
