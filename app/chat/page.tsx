"use client";
import { useState, useEffect, useRef } from "react";
import { Button, Textarea } from "@mantine/core";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState("");

  const adduser = async () => {
    try {
      const response = await axios.post("/api/user/createuser");
      console.log(response.data);
      setUser(response.data.data.user_id);
    } catch (error: any) {
      toast.error("Failed to create user");
    }
  };

  const fetchUserHistory = async () => {
    if (!user) return;
    try {
      const response = await axios.post(`/api/user/history`, { user });
      console.log(response.data);
      const history = response.data.chatHistory;
      const formattedHistory = history.map((msg: string, index: number) => ({
        id: index,
        text: msg,
        isUser: index % 2 === 0, // Assuming even indexes are user messages, odd are AI
      }));
      setMessages(formattedHistory);
    } catch (error) {
      console.error("Error fetching user history:", error);
      toast.error("Failed to fetch chat history");
    }
  };

  useEffect(() => {
    adduser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user]);

  useEffect(() => {
    if (messages.length === 0) {
      const aiMessage = {
        id: 0,
        text: "Hello, I am Fitlog. How can I help you today? Example logging: 'create routine leg day', 'i did 3 sets of squats with 10 reps of 50kg'",
        isUser: false,
      };
      setMessages([aiMessage]);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { id: messages.length, text: inputText, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");

    setLoading(true);
    try {
      const response = await fetch("/api/handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputText, user: user }),
      });

      const data = await response.json();

      if (data) {
        const gethistory = await axios.post(`/api/user/history`, { user });
        let userHistory = gethistory.data.chatHistory;
        userHistory.push(data.message);
        await axios.post(`/api/user/updatehistory`, {
          userId: user,
          messages: userHistory,
        });
      }

      const aiMessage = {
        id: messages.length + 1,
        text: data.message,
        isUser: false,
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage = {
        id: messages.length + 1,
        text: "Error: Failed to get response",
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="flex-grow flex flex-col bg-black rounded-2xl p-5 shadow-inner mb-4 border border-black">
          <div className="flex">
            <h1 className="text-3xl font-bold text-blue-500 text-center mb-5">
              Fitlog
            </h1>
            <div className="ml-auto">
              <UserButton />
            </div>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto h-0 mb-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                } mb-3`}
              >
                <div
                  className={`${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                  } max-w-xs rounded-lg p-3`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-auto">
            <Textarea
              value={inputText}
              radius="md"
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Which workout you did today?"
              minRows={1}
              autosize
              className="flex-grow bg-gray-900 text-white rounded-lg"
            />
            <Button
              color="blue"
              radius="md"
              onClick={sendMessage}
              loading={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Send
            </Button>
          </div>
          <Link
            className="px-1 py-2 mt-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center p-4 align-middle items-center justify-center"
            href="/metrics"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
