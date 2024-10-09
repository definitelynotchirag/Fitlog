'use client'
import { SignedIn, SignUp } from "@clerk/nextjs";
import axios from "axios";
import React from "react";
import toast from "react-hot-toast";

const signup = () => {
  const adduser = async () => {
    try {
      const response = await axios.post("/api/user/createuser");
    } catch (error: any) {
      toast.error("");
    }
  };
  return (
    <div>
      <SignUp
        routing="hash"
        signInUrl="/signin"
      />
    </div>
  );
};

export default signup;
