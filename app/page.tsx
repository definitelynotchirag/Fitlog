"use client";

import { useEffect, useState } from "react";
import { Button, Input, Title } from "@mantine/core";

import React from "react";
// import { processTextWithLangChainAndDecideRoute } from "./api/handler/route";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
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
      <Title>Welcome to FitLog</Title>
      <Link
        href="/chat"
        className="flex px-4 py-2 mx-auto mt-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center p-4 align-middle items-center justify-center"
      >
        Chat here
      </Link>
    </div>
  );
};

export default Home;
