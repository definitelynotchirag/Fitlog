import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId, messages } = await req.json();
  try {
    await prisma.userChatHistory.upsert({
      where: { userId },
      update: { messages },
      create: { userId, messages },
    });
    return NextResponse.json({ message: "Chat history updated" });
  } catch (error) {
    console.error("Error updating user history:", error);
    return NextResponse.json(
      { error: "Error updating user history" },
      { status: 500 },
    );
  }
}
