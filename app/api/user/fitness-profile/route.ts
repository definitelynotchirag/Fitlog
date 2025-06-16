import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json(
            {
                error: "User Not Signed In",
            },
            { status: 401 }
        );
    }

    try {
        const reqBody = await request.json();
        const { currentWeight, height, goalWeight, fitnessGoal } = reqBody;

        // Validate required fields
        if (!currentWeight || !height || !goalWeight || !fitnessGoal) {
            return NextResponse.json(
                {
                    error: "All fitness profile fields are required",
                },
                { status: 400 }
            );
        }

        // Validate fitness goal options
        const validGoals = ["lose_weight", "gain_weight", "maintain_weight", "add_muscle"];
        if (!validGoals.includes(fitnessGoal)) {
            return NextResponse.json(
                {
                    error: "Invalid fitness goal",
                },
                { status: 400 }
            );
        }

        // Update user's fitness profile
        const updatedUser = await prisma.user.update({
            where: {
                user_id: user.id,
            },
            data: {
                current_weight: parseFloat(currentWeight),
                height: parseFloat(height),
                goal_weight: parseFloat(goalWeight),
                fitness_goal: fitnessGoal,
                profile_complete: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: "Fitness profile updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating fitness profile:", error);
        return NextResponse.json(
            {
                error: "Failed to update fitness profile",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json(
            {
                error: "User Not Signed In",
            },
            { status: 401 }
        );
    }

    try {
        const userProfile = await prisma.user.findUnique({
            where: {
                user_id: user.id,
            },
            select: {
                current_weight: true,
                height: true,
                goal_weight: true,
                fitness_goal: true,
                profile_complete: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: userProfile,
        });
    } catch (error: any) {
        console.error("Error fetching fitness profile:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch fitness profile",
            },
            { status: 500 }
        );
    }
}
