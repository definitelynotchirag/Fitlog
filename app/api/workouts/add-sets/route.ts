// pages/api/workouts/add-sets.js
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
export default async function handler(req: NextRequest, res: NextResponse) {
  const { workoutId, sets } = await req.json();

  try {
    const setEntries = sets.map((set: { weight: any; reps: any }) => ({
      set_weight: set.weight,
      set_reps: set.reps,
      workout_id: workoutId,
      date: new Date(),
    }));

    await prisma.set.createMany({
      data: setEntries,
    });

    NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding sets:", error);
    NextResponse.json({ error: "Error adding sets" });
  }
}
