"use client";
import FitnessProfileModal from "@/components/FitnessProfileModal";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@mantine/core";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
    id: number;
    text: string;
    isUser: boolean;
}

export default function ChatBox() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
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
        setLoadingHistory(true);
        try {
            const response = await axios.post(`/api/user/history`, { user });
            console.log(response.data);
            const history = response.data.chatHistory;

            if (!history || history.length === 0) {
                return;
            }

            // Parse structured messages with improved logic
            const formattedHistory: ChatMessage[] = [];
            const seenMessages = new Set<string>();

            for (let i = 0; i < history.length; i++) {
                const msg = history[i];

                try {
                    // Try to parse as JSON (new structured format)
                    const parsedMsg = JSON.parse(msg);

                    // Skip empty messages or system messages
                    if (!parsedMsg.text || parsedMsg.text.trim().length === 0) {
                        continue;
                    }

                    // Create normalized message for duplicate detection
                    const normalizedText = parsedMsg.text.replace(/\s+/g, " ").trim().toLowerCase();

                    // Skip duplicates
                    if (seenMessages.has(normalizedText)) {
                        continue;
                    }

                    seenMessages.add(normalizedText);

                    formattedHistory.push({
                        id: formattedHistory.length,
                        text: parsedMsg.text,
                        isUser: parsedMsg.isUser,
                    });
                } catch {
                    // Fallback to legacy format - simple alternating pattern
                    if (!msg || msg.trim().length === 0) {
                        continue;
                    }

                    // Create normalized message for duplicate detection
                    const normalizedText = msg.replace(/\s+/g, " ").trim().toLowerCase();

                    // Skip duplicates
                    if (seenMessages.has(normalizedText)) {
                        continue;
                    }

                    seenMessages.add(normalizedText);

                    // Simple alternating pattern: even indices = user, odd = AI
                    const isUserMessage = formattedHistory.length % 2 === 0;

                    formattedHistory.push({
                        id: formattedHistory.length,
                        text: msg,
                        isUser: isUserMessage,
                    });
                }
            }

            setMessages(formattedHistory);

            // If history is very long, consider showing only recent messages in UI
            // while keeping full history in database for context
            if (formattedHistory.length > 200) {
                console.log(`Chat history contains ${formattedHistory.length} messages. Showing all messages.`);
                // Note: We're showing all messages for now, but could implement pagination here if needed
            }
        } catch (error) {
            console.error("Error fetching user history:", error);
            toast.error("Failed to fetch chat history");
        } finally {
            setLoadingHistory(false);
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
                text: `# Hello, I am **Fitlog**! 💪

I can help you manage your workouts, track calories, and answer any fitness questions.

## What I can do:

### 🏋️ Workout Management
- \`create routine leg day\`
- \`add squats, bench press, deadlifts to leg day\`
- \`i did 3 sets of squats with 10 reps of 50kg\`

### 📊 Workout History
- \`What workouts did I do yesterday?\`
- \`Show me my workout history\`
- \`How many sets of squats have I done?\`

### 🔥 Calorie Tracking
- \`I burned 150 calories doing squats\`
- Or let me **estimate** calories for you automatically!

### 🧠 Fitness Questions
- \`How do I improve my squat form?\`
- \`What exercises target the chest?\`
- \`How many calories should I eat to build muscle?\`

> **Tip:** Ask me about your workout history - I have access to all your past workouts!`,
                isUser: false,
            };
            setMessages([aiMessage]);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = { id: messages.length, text: inputText, isUser: true };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        const currentInput = inputText;
        setInputText("");

        setLoading(true);

        // Create placeholder AI message for streaming
        const aiMessageId = messages.length + 1;
        const initialAiMessage = {
            id: aiMessageId,
            text: "",
            isUser: false,
        };
        setMessages(prevMessages => [...prevMessages, initialAiMessage]);

        try {
            const response = await fetch("/api/handler-stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: currentInput, user: user }),
            });

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponseText = "";
            let caloriesInfo = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log("Streaming data:", data); // Debug log

                            if (data.type === "start") {
                                // Update message with "thinking" indicator
                                setMessages(prevMessages =>
                                    prevMessages.map(msg =>
                                        msg.id === aiMessageId ? { ...msg, text: data.message } : msg
                                    )
                                );
                            } else if (data.type === "chunk") {
                                // Update AI message with streaming content
                                if (data.content) {
                                    aiResponseText += data.content;
                                } else if (data.fullResponse) {
                                    aiResponseText = data.fullResponse;
                                } else if (data.message) {
                                    aiResponseText = data.message;
                                }

                                setMessages(prevMessages =>
                                    prevMessages.map(msg =>
                                        msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg
                                    )
                                );
                            } else if (data.type === "complete") {
                                // Final message update
                                aiResponseText = data.message;
                                caloriesInfo = data.caloriesInfo;

                                // Add calorie information if available
                                let finalMessage = aiResponseText;
                                if (caloriesInfo && caloriesInfo.totalCalories > 0) {
                                    finalMessage += `\n\nCalories burned: ${caloriesInfo.totalCalories} kcal`;
                                    if (caloriesInfo.setsWithCalories > 0) {
                                        finalMessage += `\n${caloriesInfo.setsWithCalories} sets tracked with individual calorie data`;
                                    }
                                }

                                setMessages(prevMessages =>
                                    prevMessages.map(msg =>
                                        msg.id === aiMessageId ? { ...msg, text: finalMessage } : msg
                                    )
                                );
                            } else if (data.type === "error") {
                                setMessages(prevMessages =>
                                    prevMessages.map(msg =>
                                        msg.id === aiMessageId ? { ...msg, text: "Error: " + data.message } : msg
                                    )
                                );
                            }
                        } catch (parseError) {
                            console.error("Error parsing streaming data:", parseError);
                        }
                    }
                }
            }

            // Update chat history after completion
            if (aiResponseText) {
                try {
                    const gethistory = await axios.post(`/api/user/history`, { user });
                    let userHistory = gethistory.data.chatHistory || [];

                    // Check if this conversation is already in history to prevent duplicates
                    const userMessageText = currentInput.trim();
                    const aiMessageText = aiResponseText.trim();

                    // Look for recent duplicates (last 50 messages)
                    const recentHistory = userHistory.slice(-50);
                    let isDuplicate = false;

                    for (const historyMsg of recentHistory) {
                        try {
                            const parsed = JSON.parse(historyMsg);
                            if (parsed.text === userMessageText || parsed.text === aiMessageText) {
                                isDuplicate = true;
                                break;
                            }
                        } catch {
                            // If parsing fails, check as plain text
                            if (historyMsg === userMessageText || historyMsg === aiMessageText) {
                                isDuplicate = true;
                                break;
                            }
                        }
                    }

                    if (!isDuplicate) {
                        // Add user message and AI response to history with structured format
                        const userMessageObj = JSON.stringify({ text: currentInput, isUser: true });
                        userHistory.push(userMessageObj);

                        let historyMessage = aiResponseText;
                        if (caloriesInfo && caloriesInfo.totalCalories > 0) {
                            historyMessage += `\n\nCalories burned: ${caloriesInfo.totalCalories} kcal`;
                            if (caloriesInfo.setsWithCalories > 0) {
                                historyMessage += `\n${caloriesInfo.setsWithCalories} sets tracked with individual calorie data`;
                            }
                        }
                        const aiMessageObj = JSON.stringify({ text: historyMessage, isUser: false });
                        userHistory.push(aiMessageObj);

                        await axios.post(`/api/user/updatehistory`, {
                            userId: user,
                            messages: userHistory,
                        });
                    }
                } catch (historyError) {
                    console.error("Error updating history:", historyError);
                }
            }
        } catch (error) {
            console.error("Error with streaming response:", error);
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: "Error: Failed to get response" } : msg
                )
            );
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

            <div className="w-full max-w-6xl h-[90vh] flex flex-col">
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
                        {loadingHistory ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="flex items-center space-x-2 text-blue-400">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <span className="ml-2 text-sm font-medium">Loading chat history...</span>
                                </div>
                            </div>
                        ) : (
                            messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-3`}
                                >
                                    <div
                                        className={`chat-bubble transition-all duration-300 ease-out ${
                                            message.isUser
                                                ? "bg-blue-600 text-white rounded-br-2xl rounded-tl-2xl rounded-bl-lg"
                                                : "bg-slate-800/80 text-white rounded-bl-2xl rounded-tr-2xl rounded-br-lg border border-blue-900/20"
                                        } max-w-md p-3 shadow-md
                      ${lastMsgId === message.id ? "animate-fadein" : ""}
                      `}
                                    >
                                        {message.text ? (
                                            <div className="prose prose-sm prose-invert max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => (
                                                            <p className="mb-2 last:mb-0">{children}</p>
                                                        ),
                                                        h1: ({ children }) => (
                                                            <h1 className="text-lg font-bold mb-2">{children}</h1>
                                                        ),
                                                        h2: ({ children }) => (
                                                            <h2 className="text-base font-semibold mb-2">{children}</h2>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h3 className="text-sm font-semibold mb-1">{children}</h3>
                                                        ),
                                                        ul: ({ children }) => (
                                                            <ul className="list-disc list-inside mb-2 space-y-1">
                                                                {children}
                                                            </ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="list-decimal list-inside mb-2 space-y-1">
                                                                {children}
                                                            </ol>
                                                        ),
                                                        li: ({ children }) => <li className="text-sm">{children}</li>,
                                                        code: ({ children, className }) => {
                                                            const isInline = !className;
                                                            return isInline ? (
                                                                <code className="bg-slate-700 px-1 py-0.5 rounded text-xs font-mono">
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <pre className="bg-slate-900 p-2 rounded text-xs overflow-x-auto">
                                                                    <code>{children}</code>
                                                                </pre>
                                                            );
                                                        },
                                                        strong: ({ children }) => (
                                                            <strong className="font-semibold">{children}</strong>
                                                        ),
                                                        em: ({ children }) => <em className="italic">{children}</em>,
                                                        blockquote: ({ children }) => (
                                                            <blockquote className="border-l-2 border-blue-400 pl-2 italic text-sm">
                                                                {children}
                                                            </blockquote>
                                                        ),
                                                        a: ({ children, href }) => (
                                                            <a
                                                                href={href}
                                                                className="text-blue-300 hover:text-blue-200 underline"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {children}
                                                            </a>
                                                        ),
                                                    }}
                                                >
                                                    {message.text}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <div className="typing-dot"></div>
                                                <div className="typing-dot"></div>
                                                <div className="typing-dot"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
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
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
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
                .typing-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #60a5fa;
                    animation: typing 1.4s infinite ease-in-out;
                }
                .typing-dot:nth-child(1) {
                    animation-delay: 0s;
                }
                .typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
                @keyframes typing {
                    0%,
                    60%,
                    100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
