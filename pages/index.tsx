import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm Chatbot Sonni, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?"
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (message: Message) => {
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages([...updatedMessages, data]);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while fetching the response.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm Chatbot Sonni, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`
      }
    ]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm Chatbot Sonni, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`
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

