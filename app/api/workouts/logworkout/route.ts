// pages/api/workouts/log.js
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
export default async function POST(req: NextRequest, res: NextResponse) {
  const { userId, workoutName, routineId, sets, date } = await req.json();

  try {
    // Create a workout entry
    const workout = await prisma.workout.create({
      data: {
        workout_name: workoutName,
        date: new Date(date),
        routine: {
          connect: { routine_id: routineId }, // If you want to connect to an existing routine, adjust this accordingly
        },
      },
    });

    // Create sets associated with the workout
    const setEntries = sets.map((set: { weight: any; reps: any }) => ({
      set_weight: set.weight,
      set_reps: set.reps,
      workout_id: workout.workout_id,
      date: new Date(date),
    }));

    await prisma.set.createMany({
      data: setEntries,
    });

    NextResponse.json({ success: true, workout });
  } catch (error) {
    console.error("Error logging workout:", error);
    NextResponse.json({ error: "Error logging workout" });
  }
}
