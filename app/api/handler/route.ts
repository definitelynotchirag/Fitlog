import { processTextWithLangChain } from "@/langchain/processor";
import prisma from "@/prisma/prisma";
import Fuse from "fuse.js";
import { NextRequest, NextResponse } from "next/server";

// const getRoutineIdByName = async (userId: any, routineName: any) => {
//   console.log(routineName, userId);
//   try {
//     const routine = await prisma.routine.findFirst({
//       where: {
//         user_id: userId,
//         routine_name: routineName,
//       },
//     });

//     if (routine) {
//       return routine.routine_id;
//     } else {
//       throw new Error("Routine not found");
//     }
//   } catch (error) {
//     console.error("Error fetching routine ID:", error);
//     throw new Error("Failed to retrieve routine ID");
//   }
// };

// const getWorkoutIdByName = async (
//   userId: any,
//   workoutName: any,
//   routineId: any,
// ) => {
//   try {
//     const workout = await prisma.workout.findFirst({
//       where: {
//         routine_id: routineId,
//         workout_name: workoutName,
//       },
//     });

//     if (workout) {
//       return workout.workout_id;
//     } else {
//       throw new Error("Workout not found");
//     }
//   } catch (error) {
//     console.error("Error fetching workout ID:", error);
//     throw new Error("Failed to retrieve workout ID");
//   }
// };
//
const getRoutineIdByName = async (userId: any, routineName: any) => {
    console.log(routineName, userId);
    try {
        // Fetch all routines for the user
        const routines = await prisma.routine.findMany({
            where: {
                user_id: userId,
            },
        });

        // Set up Fuse.js for fuzzy searching on routine names
        const fuse = new Fuse(routines, {
            keys: ["routine_name"], // Search based on routine_name
            threshold: 0.3, // Adjust threshold for fuzzy matching tolerance
        });

        // Perform fuzzy search for the routine name
        const result = fuse.search(routineName);

        if (result.length > 0) {
            return result[0].item.routine_id; // Return the routine_id of the best match
        } else {
            throw new Error("Routine not found");
        }
    } catch (error) {
        console.error("Error fetching routine ID:", error);
        throw new Error("Failed to retrieve routine ID");
    }
};

const getWorkoutIdByName = async (userId: any, workoutName: any, routineId: any) => {
    try {
        // Fetch all workouts for the routine
        const workouts = await prisma.workout.findMany({
            where: {
                routine_id: routineId,
            },
        });
        console.log(workouts);
        // console.log(workoutName);
        // Set up Fuse.js for fuzzy searching on workout names
        const fuse = new Fuse(workouts, {
            keys: ["workout_name"], // Search based on workout_name
            threshold: 0.3, // Adjust threshold for fuzzy matching tolerance
        });

        // Perform fuzzy search for the workout name
        const result = fuse.search(workoutName[0]);
        console.log(result);

        if (result.length > 0) {
            return result[0].item.workout_id; // Return the workout_id of the best match
        } else {
            throw new Error("Workout not found");
        }
    } catch (error) {
        console.error("Error fetching workout ID:", error);
        throw new Error("Failed to retrieve workout ID");
    }
};

export async function POST(req: NextRequest) {
    try {
        const reqBody = await req.json();
        const { prompt, user } = reqBody;
        const parsedData = await processTextWithLangChain(prompt, user);
        const { action, workoutName, sets, routineName, date, response, totalCalories } = parsedData; // Added response for fitness questions and totalCalories

        // Handle general fitness questions
        if (action === "fitness_question") {
            return NextResponse.json({
                success: true,
                message: response,
            });
        }

        // if (!routineId) {
        //   return NextResponse.json({
        //     success: false,
        //     message: "Routine not found.",
        //   });
        // }

        switch (action) {
            case "log_workout":
            case "log_workouts":
            case "record_workout":
            case "record_workouts":
            case "save_workout":
            case "save_workouts": {
                const routineId = await getRoutineIdByName(user, routineName);

                let workout = await prisma.workout.findFirst({
                    where: {
                        routine_id: routineId,
                        workout_name: workoutName[0],
                        date: new Date(date),
                    },
                });

                if (!workout) {
                    workout = await prisma.workout.create({
                        data: {
                            workout_name: workoutName[0],
                            date: new Date(date),
                            total_calories_burned: totalCalories || null,
                            routine: {
                                connect: { routine_id: routineId },
                            },
                        },
                    });
                } else {
                    // Update total calories if provided
                    if (totalCalories) {
                        workout = await prisma.workout.update({
                            where: { workout_id: workout.workout_id },
                            data: { total_calories_burned: totalCalories },
                        });
                    }
                }

                const setEntries = sets.map((set: { weight: any; reps: any; calories?: any }) => ({
                    set_weight: parseFloat(set.weight),
                    set_reps: parseInt(set.reps),
                    calories_burned: set.calories ? parseFloat(set.calories) : null,
                    workout_id: workout.workout_id,
                    date: new Date(date),
                }));

                await prisma.set.createMany({ data: setEntries });

                return NextResponse.json({
                    success: true,
                    message: `Workout ${workoutName[0]} has been successfully logged${
                        totalCalories ? ` with ${totalCalories} calories burned` : ""
                    }.`,
                    workout,
                    caloriesInfo: {
                        totalCalories: totalCalories || 0,
                        setsWithCalories: sets.filter((set: any) => set.calories).length,
                    },
                });
            }

            case "add_workout":
            case "add_workouts":
            case "create_workout":
            case "create_workouts":
            case "new_workout":
            case "new_workouts": {
                const routineId = await getRoutineIdByName(user, routineName);

                let workout = await prisma.workout.findFirst({
                    where: {
                        routine_id: routineId,
                        workout_name: workoutName[0],
                        date: new Date(date),
                    },
                });

                if (!workout) {
                    workout = await prisma.workout.create({
                        data: {
                            workout_name: workoutName[0],
                            date: new Date(date),
                            total_calories_burned: totalCalories || null,
                            routine: {
                                connect: { routine_id: routineId },
                            },
                        },
                    });
                } else {
                    // Update total calories if provided
                    if (totalCalories) {
                        workout = await prisma.workout.update({
                            where: { workout_id: workout.workout_id },
                            data: { total_calories_burned: totalCalories },
                        });
                    }
                }

                const setEntries = sets.map((set: { weight: any; reps: any; calories?: any }) => ({
                    set_weight: parseFloat(set.weight),
                    set_reps: parseInt(set.reps),
                    calories_burned: set.calories ? parseFloat(set.calories) : null,
                    workout_id: workout.workout_id,
                    date: new Date(),
                }));

                await prisma.set.createMany({ data: setEntries });

                return NextResponse.json({
                    success: true,
                    message: `Workout ${workoutName[0]} has been successfully added to routine ${routineName}${
                        totalCalories ? ` with ${totalCalories} calories burned` : ""
                    }.`,
                    workout,
                    caloriesInfo: {
                        totalCalories: totalCalories || 0,
                        setsWithCalories: sets.filter((set: any) => set.calories).length,
                    },
                });
            }

            case "create_routine":
            case "create_routines":
            case "add_routine":
            case "add_routines":
            case "new_routine":
            case "new_routines": {
                const newRoutine = await prisma.routine.create({
                    data: {
                        routine_name: routineName,
                        user: {
                            connect: { user_id: user },
                        },
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: `Routine ${routineName} has been successfully created.`,
                    routine: newRoutine,
                });
            }

            case "delete_routine":
            case "delete_routines":
            case "remove_routine":
            case "remove_routines":
            case "erase_routine":
            case "erase_routines": {
                const routineId = await getRoutineIdByName(user, routineName);
                const routine = await prisma.routine.delete({
                    where: { routine_id: routineId },
                });

                return NextResponse.json({
                    success: true,
                    message: `Routine ${routineName} has been successfully deleted.`,
                    routine,
                });
            }

            case "delete_workout":
            case "delete_workouts":
            case "remove_workout":
            case "remove_workouts":
            case "erase_workout":
            case "erase_workouts": {
                const routineId = await getRoutineIdByName(user, routineName);
                const workoutId = await getWorkoutIdByName(user, workoutName, routineId);

                const workout = await prisma.workout.delete({
                    where: { workout_id: workoutId },
                });

                return NextResponse.json({
                    success: true,
                    message: `Workout ${workoutName} has been successfully deleted from routine ${routineName}.`,
                    workout,
                });
            }

            case "delete_set":
            case "delete_sets":
            case "remove_set":
            case "remove_sets":
            case "erase_set":
            case "erase_sets": {
                const routineId = await getRoutineIdByName(user, routineName);
                const workoutId = await getWorkoutIdByName(user, workoutName, routineId);

                const set = await prisma.set.deleteMany({
                    where: { workout_id: workoutId },
                });

                return NextResponse.json({
                    success: true,
                    message: `Sets for workout ${workoutName} have been successfully deleted.`,
                    set,
                });
            }

            default:
                return NextResponse.json({
                    success: false,
                    message: "Unknown action provided.",
                });
        }
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({
            success: false,
            message: "An error occurred while processing the request.",
        });
    }
}
