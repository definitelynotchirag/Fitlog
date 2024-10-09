import axios from "axios"; // For making API requests
import { processTextWithLangChain } from "@/langchain/processor";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

const getRoutineIdByName = async (userId: any, routineName: any) => {
  // try {
  //   const response = await axios.post("./routine/getIdByName", {
  //     userId,
  //     routineName,
  //   });
  //   console.log(response.data.routineId);
  //   return response.data.routineId;
  // } catch (error) {
  //   console.error("Error fetching routine ID:", error);
  //   throw new Error("Failed to retrieve routine ID");
  // }
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
      NextResponse.json({ error: "Routine not found" });
      return 0;
    }
  } catch (error) {
    console.error("Error fetching routine ID:", error);
    NextResponse.json({ error: "Internal server error" });
    return 0;
  }
};

const getWorkoutIdbyName = async (
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
      NextResponse.json({ error: "Workout not found" });
      return 0;
    }
  } catch (error) {
    console.error("Error fetching routine ID:", error);
    NextResponse.json({ error: "Internal server error" });
    return 0;
  }
};

export async function POST(req: NextRequest, res: NextResponse) {
  const reqBody = await req.json();
  const { prompt, user } = reqBody;
  console.log(user);
  const parsedData = await processTextWithLangChain(prompt, user);
  // console.log(parsedData);
  const { action, workoutName, sets, routineName, date } = parsedData; // Expect routineName now

  const routineId = await getRoutineIdByName(user, routineName);
  try {
    if (action === "log_workout") {
      console.log(routineId);
      try {
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
                connect: { routine_id: routineId }, // If you want to connect to an existing routine, adjust this accordingly
              },
            },
          });
        }
        console.log(workout);

        // Create sets associated with the workout
        const setEntries = sets.map((set: { weight: any; reps: any }) => ({
          set_weight: parseFloat(set.weight),
          set_reps: parseInt(set.reps),
          workout_id: workout.workout_id,
          date: new Date(date),
        }));

        await prisma.set.createMany({
          data: setEntries,
        });

        return NextResponse.json({ success: true, workout });
      } catch (error) {
        console.error("Error logging workout:", error);
        return NextResponse.json({ error: "Error logging workout" });
      }
    } else if (action === "add_workout") {
      try {
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
                connect: { routine_id: routineId }, // If you want to connect to an existing routine, adjust this accordingly
              },
            },
          });
        }
        const setEntries = sets.map((set: { weight: any; reps: any }) => ({
          set_weight: parseFloat(set.weight),
          set_reps: parseInt(set.reps),
          workout_id: workoutName,
          date: new Date(),
        }));

        await prisma.set.createMany({
          data: setEntries,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error adding sets:", error);
        return NextResponse.json({ error: "Error adding sets" });
      }
    } else if (action == "create_routine") {
      // Call create routine route
      try {
        // Create a new routine associated with the user
        const newRoutine = await prisma.routine.create({
          data: {
            routine_name: routineName,
            user: {
              connect: { user_id: user }, // Connect the routine to the existing user
            },
          },
        });
        return NextResponse.json({ success: true, routine: newRoutine });
      } catch (error) {
        console.error("Error creating routine:");
        return NextResponse.json({ error: "Error creating routine" });
      }
    } else if (action == "delete_routine") {
      try {
        const routine = await prisma.routine.delete({
          where: {
            routine_id: routineId,
          },
        });
        return NextResponse.json({ success: true, routine: routine });
      } catch (error) {
        console.error("Error deleting routine:", error);
        return NextResponse.json({ error: "Error deleting routine" });
      }
    } else if (action == "delete_workout") {
      try {
        const workoutId = await getWorkoutIdbyName(
          user,
          workoutName,
          routineId,
        );
        const workout = await prisma.workout.delete({
          where: {
            routine_id: routineId,
            workout_id: workoutId,
          },
        });
        return NextResponse.json({ success: true, workout: workout });
      } catch (error) {
        console.error("Error deleting workout:", error);
        return NextResponse.json({ error: "Error deleting workout" });
      }
    } else if (action == "delete_set") {
      try {
        const workoutId = await getWorkoutIdbyName(
          user,
          workoutName,
          routineId,
        );
        const set = await prisma.set.deleteMany({
          where: {
            workout_id: workoutId,
          },
        });
        return NextResponse.json({ success: true, set: set });
      } catch (error) {
        console.error("Error deleting set:", error);
        return NextResponse.json({ error: "Error deleting set" });
      }
    } else {
      console.log("error in Langchain");
      return NextResponse.json({ error: "Error in Langchain" });
    }
  } catch (error) {
    console.error("Error calling the route:", error);
    return NextResponse.json({ error: "Failed to process the workout." });
  }
}
