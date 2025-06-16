"use client";
import FitnessProfileModal from "@/components/FitnessProfileModal";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@mantine/core";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

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
    const [showFitnessModal, setShowFitnessModal] = useState(false);

    const adduser = async () => {
        try {
            const response = await axios.post("/api/user/createuser");
            console.log(response.data);
            setUser(response.data.data.user_id);

            // Check if fitness profile is complete
            if (!response.data.data.profile_complete) {
                setShowFitnessModal(true);
            }
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
                text: "Hello, I am Fitlog! I can help you manage your workouts, track calories, and answer any fitness questions. \n\nFor workout logging: 'create routine leg day', 'i did 3 sets of squats with 10 reps of 50kg'\nCalorie tracking: 'I burned 150 calories doing squats' or let me estimate for you!\nFor fitness questions: 'How do I improve my squat form?', 'What exercises target the chest?', 'How many calories should I eat to build muscle?'",
                isUser: false,
            };
            setMessages([aiMessage]);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = { id: messages.length, text: inputText, isUser: true };
        setMessages(prevMessages => [...prevMessages, userMessage]);
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

                // Add calorie information to the message if available
                let messageText = data.message;
                if (data.caloriesInfo && data.caloriesInfo.totalCalories > 0) {
                    messageText += `\n\nCalories burned: ${data.caloriesInfo.totalCalories} kcal`;
                    if (data.caloriesInfo.setsWithCalories > 0) {
                        messageText += `\n${data.caloriesInfo.setsWithCalories} sets tracked with individual calorie data`;
                    }
                }

                userHistory.push(messageText);
                await axios.post(`/api/user/updatehistory`, {
                    userId: user,
                    messages: userHistory,
                });
            }

            const aiMessage = {
                id: messages.length + 1,
                text:
                    data.caloriesInfo && data.caloriesInfo.totalCalories > 0
                        ? `${data.message}\n\nCalories burned: ${data.caloriesInfo.totalCalories} kcal${
                              data.caloriesInfo.setsWithCalories > 0
                                  ? `\n${data.caloriesInfo.setsWithCalories} sets tracked with individual calorie data`
                                  : ""
                          }`
                        : data.message,
                isUser: false,
            };

            setMessages(prevMessages => [...prevMessages, aiMessage]);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            const errorMessage = {
                id: messages.length + 1,
                text: "Error: Failed to get response",
                isUser: false,
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const [lastMsgId, setLastMsgId] = useState<number | null>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setLastMsgId(messages[messages.length - 1].id);
        }
    }, [messages]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900 p-4">
            <FitnessProfileModal
                isOpen={showFitnessModal}
                onClose={() => setShowFitnessModal(false)}
                onComplete={() => {
                    setShowFitnessModal(false);
                    toast.success("Welcome to FitLog! Your fitness journey starts now!");
                }}
            />

            <div className="w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="flex-grow flex flex-col glassmorphism rounded-2xl p-6 shadow-2xl mb-4 border border-slate-800 backdrop-blur-lg relative">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight drop-shadow-lg">Fitlog</h1>
                        <div className="ml-auto flex items-center gap-2">
                            <Link
                                className="px-3 py-1 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600/90 transition shadow text-center font-medium"
                                href="/metrics"
                            >
                                Dashboard
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                    <div
                        ref={chatContainerRef}
                        className="flex-grow overflow-y-auto h-0 mb-2 custom-scrollbar transition-all"
                    >
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-3`}
                            >
                                <div
                                    className={`chat-bubble transition-all duration-300 ease-out ${
                                        message.isUser
                                            ? "bg-blue-600 text-white rounded-br-2xl rounded-tl-2xl rounded-bl-lg"
                                            : "bg-slate-800/80 text-white rounded-bl-2xl rounded-tr-2xl rounded-br-lg border border-blue-900/20"
                                    } max-w-xs p-3 shadow-md
                  ${lastMsgId === message.id ? "animate-fadein" : ""}
                  `}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* ChatGPT-like input box fixed at the bottom of chat container */}
                    <form
                        className="w-full flex items-end gap-3 mt-auto pt-2 pb-1 px-0 sticky bottom-0 z-10 bg-transparent"
                        onSubmit={e => {
                            e.preventDefault();
                            sendMessage();
                        }}
                    >
                        <div className="flex flex-row items-center w-full bg-slate-800/90 border border-slate-700 rounded-2xl shadow-lg px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200 min-h-[48px]">
                            <div className="flex-grow flex items-center">
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={1}
                                    className="w-full bg-transparent text-white border-none outline-none resize-none shadow-none font-normal text-base placeholder:text-slate-400 focus:outline-none focus:ring-0 leading-[1.5rem] h-7 flex items-center"
                                    style={{
                                        minHeight: "28px",
                                        maxHeight: "120px",
                                        overflowY: "auto",
                                        fontFamily: "inherit",
                                        background: "transparent",
                                        padding: 0,
                                        margin: 0,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                    autoFocus
                                />
                            </div>
                            <Button
                                color="blue"
                                radius="xl"
                                type="submit"
                                loading={loading}
                                className="ml-2 w-11 h-11 min-w-0 min-h-0 p-0 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-150 active:scale-95 send-btn"
                                style={{
                                    boxShadow: "0 2px 8px 0 rgba(37, 99, 235, 0.15)",
                                }}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Animations & Glassmorphism styles */}
            <style jsx global>{`
                .glassmorphism {
                    background: rgba(17, 24, 39, 0.7);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
                    border-radius: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .chat-bubble {
                    opacity: 0.95;
                    transition: background 0.2s, box-shadow 0.2s;
                }
                .chat-bubble.animate-fadein {
                    animation: fadein 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fadein {
                    from {
                        opacity: 0;
                        transform: translateY(16px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(30, 58, 138, 0.25);
                    border-radius: 8px;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #334155 #0f172a;
                }
                .send-btn:active {
                    filter: brightness(0.95);
                }
            `}</style>
        </div>
    );
}
