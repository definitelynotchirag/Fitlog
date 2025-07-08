import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { user } = await req.json();
    let resp = await prisma.userChatHistory.findFirst({
        where: {
            userId: user,
        },
    });
    console.log(resp);
    if (!resp) {
        // Create new chat history if none exists
        resp = await prisma.userChatHistory.create({
            data: {
                userId: user,
                messages: [],
            },
        });
    }
    return NextResponse.json({ chatHistory: resp.messages });
}
