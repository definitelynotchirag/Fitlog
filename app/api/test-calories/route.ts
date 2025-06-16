import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const userId = "user_2mmt2YuDA7jJ1gQn0J8a8nicy6n";

        // Default to last 7 days
        const end = new Date();
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        console.log("Test Calorie API called");
        console.log("Date range:", { start, end });

        // Get workouts with calorie data
        const workouts = await prisma.workout.findMany({
            where: {
                routine: {
                    user_id: userId,
                },
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                Set: {
                    select: {
                        calories_burned: true,
                        set_reps: true,
                        set_weight: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        console.log("Found workouts:", workouts.length);

        // Calculate total calories and aggregate data
        const calorieData = workouts.map(workout => {
            const setsCalories = workout.Set.reduce((total, set) => {
                return total + (set.calories_burned || 0);
            }, 0);

            const totalCalories = workout.total_calories_burned || setsCalories;

            return {
                date: workout.date.toISOString().split("T")[0],
                workoutName: workout.workout_name,
                totalCalories,
                setsCalories,
                workoutCalories: workout.total_calories_burned,
                setsCount: workout.Set.length,
            };
        });

        const totalCaloriesBurned = calorieData.reduce((total, workout) => total + workout.totalCalories, 0);

        console.log("Total calories:", totalCaloriesBurned);

        return NextResponse.json({
            success: true,
            message: "Test calorie API working!",
            data: {
                workouts: calorieData,
                totalCaloriesBurned,
                averagePerDay: totalCaloriesBurned / Math.max(calorieData.length, 1),
                dateRange: {
                    start: start.toISOString().split("T")[0],
                    end: end.toISOString().split("T")[0],
                },
            },
        });
    } catch (error:any) {
        console.error("Error in test calorie API:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch calorie data.",
            error: error.message,
        });
    }
}
