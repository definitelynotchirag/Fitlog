// "use client";
// import { useState, useEffect, useRef } from "react";
// import { Button, Textarea } from "@mantine/core";
// import axios from "axios";
// import toast from "react-hot-toast";

// interface ChatMessage {
//   id: number;
//   text: string;
//   isUser: boolean;
// }

// export default function ChatBox() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]); // Store chat history
//   const [inputText, setInputText] = useState<string>(""); // Store current input
//   const [loading, setLoading] = useState<boolean>(false); // Handle loading state
//   const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
//   const [user, setUser] = useState("");

//   const adduser = async () => {
//     try {
//       const response = await axios.post("/api/user/createuser");
//       console.log(response.data);
//       setUser(response.data.data.user_id);
//     } catch (error: any) {
//       toast.error("");
//     }
//   };

//   useEffect(() => {
//     adduser();
//   }, []);
//   // Function to send user input and get response
//   const sendMessage = async () => {
//     if (!inputText.trim()) return; // Prevent empty input submission

//     // Append user input to message history
//     const userMessage = { id: messages.length, text: inputText, isUser: true };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);
//     setInputText(""); // Clear input field

//     setLoading(true); // Start loading
//     try {
//       // Call your backend route to process the text using LangChain
//       console.log(inputText);
//       const response = await fetch("/api/handler", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ prompt: inputText, user: user }), // Use the actual userId
//       });

//       const data = await response.json();

//       // Append AI response to message history
//       const aiMessage = {
//         id: messages.length + 1,
//         text: JSON.stringify(data.message),
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, aiMessage]);
//     } catch (error) {
//       console.error("Error fetching AI response:", error);
//       const errorMessage = {
//         id: messages.length + 1,
//         text: "Error: Failed to get response",
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, errorMessage]);
//     } finally {
//       setLoading(false); // End loading
//     }
//   };

//   // Auto-scroll to the bottom when a new message is added
//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop =
//         chatContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   return (
//     <div className="flex flex-col max-h-screen bg-gray-50 p-5 rounded-lg shadow-md w-full max-w-2xl mx-auto">
//       {/* Chat container */}
//       <div
//         ref={chatContainerRef}
//         className="flex-grow overflow-y-auto bg-white rounded-lg p-5 shadow-inner mb-4 max-h-[70vh] border border-gray-300"
//       >
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex ${
//               message.isUser ? "justify-end" : "justify-start"
//             } mb-3`}
//           >
//             <div
//               className={`${
//                 message.isUser
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-300 text-black"
//               } max-w-xs rounded-lg p-3`}
//             >
//               {message.text}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Input Box */}
//       <div className="flex items-center gap-3">
//         <Textarea
//           value={inputText}
//           onChange={(e) => setInputText(e.target.value)}
//           placeholder="Type your message..."
//           minRows={1}
//           autosize
//           className="flex-grow"
//         />

//         <Button
//           color="blue"
//           onClick={sendMessage}
//           disabled={loading || !inputText.trim()}
//           loading={loading}
//           className="px-4 py-2"
//         >
//           Send
//         </Button>
//       </div>
//     </div>
//   );
// }
// "use client";
// import { useState, useEffect, useRef } from "react";
// import { Button, Textarea } from "@mantine/core";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { redirect } from "next/navigation";
// import Router, { useRouter } from "next/router";
// import Link from "next/link";

// interface ChatMessage {
//   id: number;
//   text: string;
//   isUser: boolean;
// }

// export default function ChatBox() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]); // Store chat history
//   const [inputText, setInputText] = useState<string>(""); // Store current input
//   const [loading, setLoading] = useState<boolean>(false); // Handle loading state
//   const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
//   const [user, setUser] = useState("");

//   const adduser = async () => {
//     try {
//       const response = await axios.post("/api/user/createuser");
//       console.log(response.data);
//       setUser(response.data.data.user_id);
//     } catch (error: any) {
//       toast.error("");
//     }
//   };

//   useEffect(() => {
//     adduser();
//   }, []);

//   // Function to send user input and get response
//   const sendMessage = async () => {
//     if (!inputText.trim()) return; // Prevent empty input submission

//     // Append user input to message history
//     const userMessage = { id: messages.length, text: inputText, isUser: true };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);
//     setInputText(""); // Clear input field

//     setLoading(true); // Start loading
//     try {
//       // Call your backend route to process the text using LangChain
//       console.log(inputText);
//       const response = await fetch("/api/handler", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ prompt: inputText, user: user }), // Use the actual userId
//       });

//       const data = await response.json();

//       // Append AI response to message history
//       const aiMessage = {
//         id: messages.length + 1,
//         text: JSON.stringify(data.message),
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, aiMessage]);
//     } catch (error) {
//       console.error("Error fetching AI response:", error);
//       const errorMessage = {
//         id: messages.length + 1,
//         text: "Error: Failed to get response",
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, errorMessage]);
//     } finally {
//       setLoading(false); // End loading
//     }
//   };

//   // Auto-scroll to the bottom when a new message is added
//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop =
//         chatContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   return (
//     <div className="flex flex-col max-h-screen bg-black p-4 rounded-lg shadow-md w-full max-w-2xl mx-auto">
//       {/* Chat container */}
//       <h1 className="text-3xl font-bold text-blue-500 text-center mb-5">
//         Fitlog
//       </h1>
//       <div
//         ref={chatContainerRef}
//         className="flex-grow overflow-y-auto bg-gray-900 rounded-lg p-5 shadow-inner mb-4 max-h-[70vh] border border-gray-700"
//       >
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex ${
//               message.isUser ? "justify-end" : "justify-start"
//             } mb-3`}
//           >
//             <div
//               className={`${
//                 message.isUser
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-700 text-white"
//               } max-w-xs rounded-lg p-3`}
//             >
//               {message.text}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Input Box */}
//       <div className="flex items-center gap-3">
//         <Textarea
//           value={inputText}
//           onChange={(e) => setInputText(e.target.value)}
//           placeholder="Type your message..."
//           minRows={1}
//           autosize
//           className="flex-grow bg-gray-800 text-white"
//         />

//         <Button
//           color="blue"
//           onClick={sendMessage}
//           disabled={loading || !inputText.trim()}
//           loading={loading}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
//         >
//           Send
//         </Button>
//       </div>
//       <Link className="text-center p-4 align-middle" href={"/metrics"}>
//         Dashboard
//       </Link>
//     </div>
//   );
// }
// "use client";
// import { useState, useEffect, useRef } from "react";
// import { Button, Textarea } from "@mantine/core";
// import axios from "axios";
// import toast from "react-hot-toast";
// import Link from "next/link";

// interface ChatMessage {
//   id: number;
//   text: string;
//   isUser: boolean;
// }

// export default function ChatBox() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [inputText, setInputText] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);
//   const chatContainerRef = useRef<HTMLDivElement>(null);
//   const [user, setUser] = useState("");

//   const adduser = async () => {
//     try {
//       const response = await axios.post("/api/user/createuser");
//       console.log(response.data);
//       setUser(response.data.data.user_id);
//     } catch (error: any) {
//       toast.error("");
//     }
//   };

//   useEffect(() => {
//     adduser();
//   }, []);

//   const sendMessage = async () => {
//     if (!inputText.trim()) return;

//     const userMessage = { id: messages.length, text: inputText, isUser: true };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);
//     setInputText("");

//     setLoading(true);
//     try {
//       const response = await fetch("/api/handler", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ prompt: inputText, user: user }),
//       });

//       const data = await response.json();

//       const aiMessage = {
//         id: messages.length + 1,
//         text: JSON.stringify(data.message),
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, aiMessage]);
//     } catch (error) {
//       console.error("Error fetching AI response:", error);
//       const errorMessage = {
//         id: messages.length + 1,
//         text: "Error: Failed to get response",
//         isUser: false,
//       };
//       setMessages((prevMessages) => [...prevMessages, errorMessage]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop =
//         chatContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-slate-900 p-4">
//       <div className="w-full max-w-2xl h-[80vh] flex flex-col">
//         <div className="flex-grow flex flex-col bg-black rounded-lg p-5 shadow-inner mb-4 border border-black">
//           <h1 className="text-3xl font-bold text-blue-500 text-center mb-5">
//             Fitlog
//           </h1>
//           <div ref={chatContainerRef} className="flex-grow overflow-y-auto">
//             {messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`flex ${
//                   message.isUser ? "justify-end" : "justify-start"
//                 } mb-3`}
//               >
//                 <div
//                   className={`${
//                     message.isUser
//                       ? "bg-blue-500 text-white"
//                       : "bg-gray-700 text-white"
//                   } max-w-xs rounded-lg p-3`}
//                 >
//                   {message.text}
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="flex items-center gap-3 mt-4">
//             <Textarea
//               value={inputText}
//               onChange={(e) => setInputText(e.target.value)}
//               placeholder="Type your message..."
//               minRows={1}
//               autosize
//               className="flex-grow bg-gray-800 text-white"
//             />
//             <Button
//               color="blue"
//               onClick={sendMessage}
//               // disabled={loading || !inputText.trim()}
//               loading={loading}
//               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
//             >
//               Send
//             </Button>
//           </div>
//         </div>
//         <Link
//           className="px-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center p-4  align-middle items-center justify-center "
//           href="/metrics"
//         >
//           Dashboard
//         </Link>
//       </div>
//     </div>
//   );
// }
"use client";
import { useState, useEffect, useRef } from "react";
import { Button, Textarea } from "@mantine/core";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

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
      toast.error("");
    }
  };

  useEffect(() => {
    adduser();
  }, []);

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

      const aiMessage = {
        id: messages.length + 1,
        text: JSON.stringify(data.message),
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
        <div className="flex-grow flex flex-col bg-black rounded-lg p-5 shadow-inner mb-4 border border-black">
          <h1 className="text-3xl font-bold text-blue-500 text-center mb-5">
            Fitlog
          </h1>
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
                      ? "bg-blue-500 text-white"
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
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              minRows={1}
              autosize
              className="flex-grow bg-gray-800 text-white"
            />
            <Button
              color="blue"
              onClick={sendMessage}
              loading={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Send
            </Button>
          </div>
        </div>
        <Link
          className="px-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center p-4 align-middle items-center justify-center"
          href="/metrics"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
