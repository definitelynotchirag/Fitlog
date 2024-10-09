// pages/api/routines/create.js
import prisma from "@/prisma/prisma"; // Import your Prisma client
import { NextRequest, NextResponse } from "next/server";

export default async function POST(req: NextRequest, res: NextResponse) {
  const { userId, routineName } = await req.json(); // Expecting routineName from the request body
  console.log(userId, routineName);
  try {
    // Create a new routine associated with the user
    const newRoutine = await prisma.routine.create({
      data: {
        routine_name: routineName,
        user: {
          connect: { user_id: userId }, // Connect the routine to the existing user
        },
      },
    });

    return NextResponse.json({ success: true, routine: newRoutine });
  } catch (error) {
    console.error("Error creating routine:");
    return NextResponse.json({ error: "Error creating routine" });
  }
}
