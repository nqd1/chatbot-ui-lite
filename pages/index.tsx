import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import { GeminiStream } from "@/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const startMessages = "Xin chào! Tôi là Chatbot Sinno, một trợ lý AI. Tôi có thể giúp bạn với những việc như trả lời câu hỏi, cung cấp thông tin, và hỗ trợ các nhiệm vụ. Tôi có thể giúp gì cho bạn?";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: startMessages
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [streamedResponse, setStreamedResponse] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (message: Message) => {
    const updatedMessages = [...messages, message];

    setMessages(updatedMessages);
    setLoading(true);
    setStreaming(false);
    setStreamedResponse("");

    try {
      // Luôn dùng streaming
      const streamingEnabled = true;

      if (streamingEnabled) {
        setStreaming(true);
        
        // Add an empty assistant message that will be filled by streaming
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: ""
          }
        ]);

        // Use streaming response
        try {
          console.log("Fetching streaming response...");
          const stream = await GeminiStream(updatedMessages);
          
          if (!stream) {
            throw new Error("Không nhận được phản hồi từ API");
          }
          
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let accumulatedResponse = "";

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (done) break;
            
            const chunkValue = decoder.decode(value);
            accumulatedResponse += chunkValue;
            
            console.log("Current chunk:", chunkValue);
            console.log("Accumulated:", accumulatedResponse);
            
            // Update the current streaming response
            setStreamedResponse(accumulatedResponse);
            
            // Update the last message from the assistant with the accumulated text
            setMessages((current) => [
              ...current.slice(0, -1),
              {
                role: "assistant",
                content: accumulatedResponse
              }
            ]);
          }
        } catch (streamingError) {
          console.error("Streaming error:", streamingError);
          // Handle streaming error - replace empty message with error
          setMessages((current) => [
            ...current.slice(0, -1), 
            {
              role: "assistant", 
              content: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn."
            }
          ]);
        }

        setStreaming(false);
        
      } else {
        // Traditional non-streaming request
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: updatedMessages
          })
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        
        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            content: data.content
          }
        ]);
      }
      
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn."
        }
      ]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: startMessages
      }
    ]);
    setStreaming(false);
    setStreamedResponse("");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: startMessages
      }
    ]);
  }, []);

  return (
    <>
      <Head>
        <title>Chatbot Sinno</title>
        <meta name="description" content="AI Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Sinno_logo.png" />
      </Head>

      <div className="flex flex-col h-screen bg-[#ffd4d4]">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <div className="max-w-[800px] mx-auto h-full">
            <Chat
              messages={messages}
              loading={loading}
              streaming={streaming}
              onSend={handleSend}
              onReset={handleReset}
            />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

