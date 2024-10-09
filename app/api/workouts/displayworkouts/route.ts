import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { routineId } = await req.json();

    if (!routineId) {
      return NextResponse.json(
        { error: "Routine ID is required" },
        { status: 400 },
      );
    }

    const workouts = await prisma.workout.findMany({
      where: {
        routine_id: routineId,
      },
    });

    return NextResponse.json({ workouts });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json(
      { error: "Error fetching workouts" },
      { status: 500 },
    );
  }
}
