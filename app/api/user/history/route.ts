import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import prisma from "@/prisma/prisma";

export async function POST(req: NextRequest) {
  const { user } = await req.json();
  const resp = await prisma.userChatHistory.findFirst({
    where: {
      userId: user,
    },
  });
  console.log(resp);
  if (!resp) {
    return NextResponse.json(
      { error: "No chat history found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ chatHistory: resp.messages });
}
