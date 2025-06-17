import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all workouts for the user with their sets
        const workouts = await prisma.workout.findMany({
            where: {
                routine: {
                    user_id: user.id,
                },
            },
            include: {
                Set: true,
                routine: {
                    select: {
                        routine_name: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        // Group workouts by date
        const workoutsByDate = workouts.reduce((acc, workout) => {
            const dateKey = workout.date.toISOString().split("T")[0]; // YYYY-MM-DD format

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }

            acc[dateKey].push({
                workout_id: workout.workout_id,
                workout_name: workout.workout_name,
                routine_name: workout.routine.routine_name,
                date: workout.date,
                duration_minutes: workout.duration_minutes,
                notes: workout.notes,
                total_calories_burned: workout.total_calories_burned,
                workout_type: workout.workout_type,
                sets_count: workout.Set.length,
                total_reps: workout.Set.reduce((sum, set) => sum + set.set_reps, 0),
                total_weight: workout.Set.reduce((sum, set) => sum + set.set_weight * set.set_reps, 0),
            });

            return acc;
        }, {} as Record<string, any[]>);

        return NextResponse.json({
            success: true,
            workoutsByDate,
            totalWorkoutDays: Object.keys(workoutsByDate).length,
            totalWorkouts: workouts.length,
        });
    } catch (error) {
        console.error("Error fetching workouts by date:", error);
        return NextResponse.json({ error: "Error fetching workouts by date" }, { status: 500 });
    }
}
