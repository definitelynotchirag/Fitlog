import axios from "axios";
import { processTextWithLangChain } from "@/langchain/processor";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

const getRoutineIdByName = async (userId: any, routineName: any) => {
  console.log(routineName, userId);
  try {
    const routine = await prisma.routine.findFirst({
      where: {
        user_id: userId,
        routine_name: routineName,
      },
    });

    if (routine) {
      return routine.routine_id;
    } else {
      throw new Error("Routine not found");
    }
  } catch (error) {
    console.error("Error fetching routine ID:", error);
    throw new Error("Failed to retrieve routine ID");
  }
};

const getWorkoutIdByName = async (
  userId: any,
  workoutName: any,
  routineId: any,
) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: {
        routine_id: routineId,
        workout_name: workoutName,
      },
    });

    if (workout) {
      return workout.workout_id;
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
    const { action, workoutName, sets, routineName, date } = parsedData; // Expect routineName now

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
              routine: {
                connect: { routine_id: routineId },
              },
            },
          });
        }

        const setEntries = sets.map((set: { weight: any; reps: any }) => ({
          set_weight: parseFloat(set.weight),
          set_reps: parseInt(set.reps),
          workout_id: workout.workout_id,
          date: new Date(date),
        }));

        await prisma.set.createMany({ data: setEntries });

        return NextResponse.json({
          success: true,
          message: `Workout ${workoutName[0]} has been successfully logged.`,
          workout,
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
              routine: {
                connect: { routine_id: routineId },
              },
            },
          });
        }

        const setEntries = sets.map((set: { weight: any; reps: any }) => ({
          set_weight: parseFloat(set.weight),
          set_reps: parseInt(set.reps),
          workout_id: workout.workout_id,
          date: new Date(),
        }));

        await prisma.set.createMany({ data: setEntries });

        return NextResponse.json({
          success: true,
          message: `Workout ${workoutName[0]} has been successfully added to routine ${routineName}.`,
          workout,
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
        const workoutId = await getWorkoutIdByName(
          user,
          workoutName,
          routineId,
        );

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
        const workoutId = await getWorkoutIdByName(
          user,
          workoutName,
          routineId,
        );

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
