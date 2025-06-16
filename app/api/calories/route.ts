import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const reqBody = await req.json();
        const { userId, startDate, endDate } = reqBody;

        console.log("Calorie API called with:", { userId, startDate, endDate });

        // Default to last 7 days if no date range provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
        console.log("Workouts data:", JSON.stringify(workouts, null, 2));

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

        // Group by date for daily totals
        const dailyTotals = calorieData.reduce((acc: any, workout) => {
            const date = workout.date;
            if (!acc[date]) {
                acc[date] = {
                    date,
                    totalCalories: 0,
                    workouts: [],
                };
            }
            acc[date].totalCalories += workout.totalCalories;
            acc[date].workouts.push(workout);
            return acc;
        }, {});

        const totalCaloriesBurned = calorieData.reduce((total, workout) => total + workout.totalCalories, 0);

        return NextResponse.json({
            success: true,
            data: {
                workouts: calorieData,
                dailyTotals: Object.values(dailyTotals),
                totalCaloriesBurned,
                averagePerDay: totalCaloriesBurned / Math.max(Object.keys(dailyTotals).length, 1),
                dateRange: {
                    start: start.toISOString().split("T")[0],
                    end: end.toISOString().split("T")[0],
                },
            },
        });
    } catch (error) {
        console.error("Error fetching calorie data:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch calorie data.",
        });
    }
}
