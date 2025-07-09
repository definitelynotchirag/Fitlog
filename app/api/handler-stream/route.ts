import { processTextWithLangChainStream } from "@/langchain/streaming-processor";
import prisma from "@/prisma/prisma";
import Fuse from "fuse.js";
import { NextRequest } from "next/server";

export const maxDuration = 30; // Maximum duration for the streaming response in seconds

// Helper functions for database operations
const getRoutineIdByName = async (userId: any, routineName: any) => {
    console.log("Looking for routine:", routineName, "for user:", userId);
    try {
        const routines = await prisma.routine.findMany({
            where: { user_id: userId },
        });

        const fuse = new Fuse(routines, {
            keys: ["routine_name"],
            threshold: 0.4,
        });

        const result = fuse.search(routineName);
        if (result.length > 0) {
            return result[0].item.routine_id;
        } else {
            // If routine not found, create it
            const newRoutine = await prisma.routine.create({
                data: {
                    routine_name: routineName,
                    user_id: userId,
                },
            });
            return newRoutine.routine_id;
        }
    } catch (error) {
        console.error("Error fetching routine ID:", error);
        throw new Error("Failed to retrieve or create routine ID");
    }
};
const getWorkoutIdByName = async (userId: any, workoutName: any, routineId: any, date?: any) => {
    try {
        const workouts = await prisma.workout.findMany({
            where: { routine_id: routineId },
        });

        const fuse = new Fuse(workouts, {
            keys: ["workout_name"],
            threshold: 0.4,
        });

        const result = fuse.search(workoutName);
        if (result.length > 0) {
            return result[0].item.workout_id;
        } else {
            // If workout not found, create it
            const newWorkout = await prisma.workout.create({
                data: {
                    workout_name: workoutName,
                    routine_id: routineId,
                    date: date ? new Date(date) : new Date(),
                    total_calories_burned: null,
                },
            });
            return newWorkout.workout_id;
        }
    } catch (error) {
        console.error("Error fetching workout ID:", error);
        throw new Error("Failed to retrieve or create workout ID");
    }
};

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const reqBody = await req.json();
                const { prompt, user } = reqBody;

                // Send initial response
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({ type: "start", message: "Analyzing your request..." })}\n\n`
                    )
                );

                // Process with streaming AI
                for await (const chunk of processTextWithLangChainStream(prompt, user)) {
                    if (chunk.type === "fitness_response_chunk") {
                        // Stream fitness advice
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "chunk",
                                    content: chunk.content,
                                    fullResponse: chunk.fullResponse,
                                    isComplete: false,
                                })}\n\n`
                            )
                        );
                    } else if (chunk.type === "fitness_response_complete") {
                        // Complete fitness response
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "complete",
                                    message: chunk.fullResponse,
                                    isComplete: true,
                                })}\n\n`
                            )
                        );
                    } else if (chunk.type === "workout_data") {
                        // Handle workout command
                        const { action, workoutName, sets, routineName, date, totalCalories } = chunk.data;
                        try {
                            let result;

                            // Validate that workoutName exists and is an array
                            // if (
                            //     !chunk.data.workoutName ||
                            //     !Array.isArray(chunk.data.workoutName) ||
                            //     chunk.data.workoutName.length === 0
                            // ) {
                            //     controller.enqueue(
                            //         encoder.encode(
                            //             `data: ${JSON.stringify({
                            //                 type: "error",
                            //                 message:
                            //                     "Could not extract workout names from your request. Please specify the exercises you want to add.",
                            //             })}\n\n`
                            //         )
                            //     );
                            //     continue;
                            // }

                            switch (action) {
                                case "log_workout":
                                case "log_workouts":
                                case "record_workout":
                                case "record_workouts":
                                case "save_workout":
                                case "save_workouts": {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "chunk",
                                                content: "Logging your workout...",
                                                isComplete: false,
                                            })}\n\n`
                                        )
                                    );

                                    const routineId = await getRoutineIdByName(user, routineName);
                                    const workoutId = await getWorkoutIdByName(user, workoutName[0], routineId);

                                    // Update workout with total calories if provided
                                    if (totalCalories) {
                                        await prisma.workout.update({
                                            where: { workout_id: workoutId },
                                            data: { total_calories_burned: totalCalories },
                                        });
                                    }

                                    // Add sets
                                    const createdSets = await Promise.all(
                                        sets.map((set: any) =>
                                            prisma.set.create({
                                                data: {
                                                    workout_id: workoutId,
                                                    set_reps: set.reps,
                                                    set_weight: parseFloat(set.weight),
                                                    calories_burned: set.calories || null,
                                                    date: new Date(date),
                                                },
                                            })
                                        )
                                    );

                                    const caloriesInfo = {
                                        totalCalories: totalCalories || 0,
                                        setsWithCalories: sets.filter((set: any) => set.calories).length,
                                    };

                                    const message = `Great! I've logged your ${workoutName[0]} workout with ${sets.length} sets to your ${routineName} routine.`;

                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "complete",
                                                message: message,
                                                caloriesInfo: caloriesInfo,
                                                isComplete: true,
                                            })}\n\n`
                                        )
                                    );
                                    break;
                                }

                                case "create_routine": {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "chunk",
                                                content: "Creating new routine...",
                                                isComplete: false,
                                            })}\n\n`
                                        )
                                    );

                                    const routine = await prisma.routine.create({
                                        data: {
                                            routine_name: routineName,
                                            user_id: user,
                                        },
                                    });

                                    const message = `Perfect! I've created the "${routineName}" routine for you. You can now start adding workouts to it!`;

                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "complete",
                                                message: message,
                                                isComplete: true,
                                            })}\n\n`
                                        )
                                    );
                                    break;
                                }

                                case "add_workout": {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "chunk",
                                                content: "Adding workout to routine...",
                                                isComplete: false,
                                            })}\n\n`
                                        )
                                    );

                                    const routineId = await getRoutineIdByName(user, routineName);

                                    const workout = await prisma.workout.create({
                                        data: {
                                            workout_name: workoutName[0],
                                            routine_id: routineId,
                                            date: new Date(date),
                                            total_calories_burned: totalCalories || null,
                                        },
                                    });

                                    const message = `Excellent! I've added "${workoutName[0]}" to your ${routineName} routine. Ready to log some sets!`;

                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "complete",
                                                message: message,
                                                isComplete: true,
                                            })}\n\n`
                                        )
                                    );
                                    break;
                                }

                                case "add_multiple_workouts": {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "chunk",
                                                content: `Adding ${workoutName.length} workouts to routine...`,
                                                isComplete: false,
                                            })}\n\n`
                                        )
                                    );

                                    const routineId = await getRoutineIdByName(user, routineName);

                                    // Create multiple workouts
                                    const createdWorkouts = await Promise.all(
                                        workoutName.map((workout: string) =>
                                            prisma.workout.create({
                                                data: {
                                                    workout_name: workout,
                                                    routine_id: routineId,
                                                    date: new Date(date),
                                                    total_calories_burned: null, // Will be set when logging sets
                                                },
                                            })
                                        )
                                    );

                                    const workoutList = workoutName.join(", ");
                                    const message = `Perfect! I've added ${workoutName.length} workouts to your ${routineName} routine: ${workoutList}. You're all set to start logging sets for these exercises!`;

                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "complete",
                                                message: message,
                                                isComplete: true,
                                            })}\n\n`
                                        )
                                    );
                                    break;
                                }

                                default: {
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify({
                                                type: "complete",
                                                message:
                                                    "I understand your request, but I'm not sure how to handle that action yet.",
                                                isComplete: true,
                                            })}\n\n`
                                        )
                                    );
                                }
                            }
                        } catch (dbError) {
                            console.error("Database operation error:", dbError);
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({
                                        type: "error",
                                        message: "Sorry, I encountered an error while processing your workout data.",
                                    })}\n\n`
                                )
                            );
                        }
                    } else if (chunk.type === "error") {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "error",
                                    message: chunk.message,
                                })}\n\n`
                            )
                        );
                    }
                }
            } catch (error) {
                console.error("Streaming error:", error);
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "error",
                            message: "Sorry, I encountered an error processing your request.",
                        })}\n\n`
                    )
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
