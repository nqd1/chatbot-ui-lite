import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState, useCallback } from "react";

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamIdRef = useRef<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Function to handle streaming content updates
  const updateStreamingContent = useCallback((text: string) => {
    setStreamedResponse(text);
    // Update the streaming message
    setMessages((currentMessages) => {
      const updatedMessages = [...currentMessages];
      const lastIndex = updatedMessages.length - 1;
      
      if (lastIndex >= 0 && updatedMessages[lastIndex].isStreaming) {
        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          content: text
        };
      }
      
      return updatedMessages;
    });
  }, []);

  // Close any active connections
  const cleanupConnections = useCallback(() => {
    // Abort any fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset stream ID
    streamIdRef.current = "";
  }, []);

  const handleSend = async (message: Message) => {
    // Clean up any existing connections
    cleanupConnections();
    
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setLoading(true);
    setStreaming(false);
    setStreamedResponse("");

    try {
      // Create placeholder for assistant response
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: "", // Start with empty content
          isStreaming: true, // Mark message as streaming
          timestamp: Date.now()
        }
      ]);
      
      setLoading(false);
      setStreaming(true);

      // Generate a unique ID for this streaming session
      const streamId = Date.now().toString();
      streamIdRef.current = streamId;

      // Create controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Make the stream request
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          streamId: streamId
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      // Read the stream
      const decoder = new TextDecoder();
      let accumulatedChunks = '';

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Stream complete
              setStreaming(false);
              
              // Finalize the message
              setMessages((currentMessages) => {
                const updatedMessages = [...currentMessages];
                const lastIndex = updatedMessages.length - 1;
                
                if (lastIndex >= 0 && updatedMessages[lastIndex].isStreaming) {
                  updatedMessages[lastIndex] = {
                    role: "assistant",
                    content: accumulatedChunks,
                    isStreaming: false,
                    timestamp: Date.now()
                  };
                }
                
                return updatedMessages;
              });
              
              break;
            }

            // Decode and process the chunk
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.slice(6));
                  
                  if (eventData.error) {
                    console.error("Stream error:", eventData.error);
                    updateStreamingContent("Đã xảy ra lỗi: " + eventData.error);
                    setStreaming(false);
                    return;
                  }
                  
                  if (eventData.type === 'chunk') {
                    accumulatedChunks = eventData.content;
                    updateStreamingContent(accumulatedChunks);
                  } else if (eventData.type === 'end') {
                    accumulatedChunks = eventData.content;
                    updateStreamingContent(accumulatedChunks);
                  }
                } catch (e) {
                  console.error("Error parsing SSE message:", e, line);
                }
              }
            }
          }
        } catch (err) {
          if (controller.signal.aborted) {
            console.log("Stream reading aborted");
          } else {
            console.error("Error reading stream:", err);
            setStreaming(false);
            
            // Ensure we have a complete message even on error
            if (accumulatedChunks) {
              setMessages((currentMessages) => {
                const updatedMessages = [...currentMessages];
                const lastIndex = updatedMessages.length - 1;
                
                if (lastIndex >= 0 && updatedMessages[lastIndex].isStreaming) {
                  updatedMessages[lastIndex] = {
                    role: "assistant",
                    content: accumulatedChunks || "Đã xảy ra lỗi khi nhận phản hồi.",
                    isStreaming: false,
                    timestamp: Date.now()
                  };
                }
                
                return updatedMessages;
              });
            }
          }
        } finally {
          reader.releaseLock();
        }
      };

      // Start reading the stream
      readStream();
      
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại."
        }
      ]);
      setStreaming(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Clean up any existing connections
    cleanupConnections();
    
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
    if (streaming || messages.some(m => m.isStreaming)) {
      scrollToBottom();
    }
  }, [messages, streamedResponse, streaming, scrollToBottom]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: startMessages
      }
    ]);
    
    // Cleanup function to abort any streaming on unmount
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

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

