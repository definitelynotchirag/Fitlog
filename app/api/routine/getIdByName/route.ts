// In your routines API (e.g., api/routines/getIdByName.js)

import prisma from "@/prisma/prisma"; // Adjust import based on your project structure
import { NextRequest, NextResponse } from "next/server";

export default async function POST(req: NextRequest, res: NextResponse) {
  const { userId, routineName } = await req.json();

  if (req.method === "POST") {
    try {
      const routine = await prisma.routine.findFirst({
        where: {
          user_id: userId,
          routine_name: routineName,
        },
      });

      if (routine) {
        return NextResponse.json({ routineId: routine.routine_id });
      } else {
        return NextResponse.json({ error: "Routine not found" });
      }
    } catch (error) {
      console.error("Error fetching routine ID:", error);
      return NextResponse.json({ error: "Internal server error" });
    }
  } else {
    NextResponse.json({ error: "Invalid request method" });
  }
}
