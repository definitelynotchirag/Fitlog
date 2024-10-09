// "use client";

// import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
// import { Button, Container, Input, Title } from "@mantine/core";
// import axios from "axios";
// import { useState } from "react";
// import toast from "react-hot-toast";

// export default function Home() {
//   const [routines, setRoutines] = useState([]);
//   const [error, setError] = useState("");
//   const [user, setUser] = useState("");

//   const adduser = async () => {
//     try {
//       const response = await axios.post("/api/user/createuser");
//       setUser(response.data.data.user_id);
//     } catch (error: any) {
//       toast.error("");
//     }
//   };

//   const getAllRoutines = async () => {
//     try {
//       const response = await axios.get("/api/routine/displayroutines");
//       console.log(response.data);
//       setRoutines(response.data.data);
//       setError("");
//     } catch (error: any) {
//       console.error("Error fetching routines:", error);
//       setError(
//         error.response?.data?.error ||
//           "An error occurred while fetching routines"
//       );
//     }
//   };

//   return (
//     <div className="container rounded-lg p-10 w-auto mx-auto bg-black">
//       <Title className="text-center pb-3">FitLog</Title>
//       <Button onClick={getAllRoutines}>Get all routines</Button>
//       <Button>Create Routine</Button>
//       {error && <p className="text-red-500">{error}</p>}
//       {routines.length > 0 && (
//         <ul>
//           {routines.map((routine: any, index: number) => (
//             <li key={index}>{JSON.stringify(routine)}</li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

"use client";

// ChatComponent.js
import { useEffect, useState } from "react";
import { Button, Input } from "@mantine/core";

import React from "react";
// import { processTextWithLangChainAndDecideRoute } from "./api/handler/route";
import axios from "axios";
import toast from "react-hot-toast";
// import { processTextWithLangChain } from "@/langchain/processor";

const Home = () => {
  const [prompt, setPrompt] = useState("");
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
  const runprocessor = async () => {
    try {
      const resp = await axios.post("/api/handler", { prompt, user });
      console.log(resp);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    adduser();
  }, []);
  return (
    <div>
      <Input
        placeholder="Enter Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      ></Input>
      <Button onClick={runprocessor}>Submit</Button>
    </div>
  );
};

export default Home;
