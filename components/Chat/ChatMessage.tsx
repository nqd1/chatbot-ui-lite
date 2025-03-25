import { Message } from "@/types";
import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";

interface Props {
  message: Message;
}

export const ChatMessage: FC<Props> = ({ message }) => {
  const messageClassName = message.role === "assistant" 
    ? "bg-neutral-100 text-neutral-900" 
    : "flex items-center bg-[#e24242] text-white rounded-2xl px-3 py-2 max-w-[67%] whitespace-pre-wrap";

  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      } mb-4`}
    >
      <div
        className={`flex ${
          message.role === "assistant" ? "justify-start" : "justify-end"
        }`}
      >
        <div className={`flex ${messageClassName}`}>
          <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: {
                  node: any;
                  inline: boolean;
                  className: string | undefined;
                  children: React.ReactNode;
                  [key: string]: any;
                }) {
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock
                      language={className?.replace("language-", "") ?? ""}
                      value={String(children).replace(/\n$/, "")}
                      {...props}
                    />
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
