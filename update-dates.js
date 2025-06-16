const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateWorkoutDates() {
    try {
        const today = new Date();

        // Get all workouts with old dates
        const workouts = await prisma.workout.findMany({
            where: {
                routine: {
                    user_id: "user_2mmt2YuDA7jJ1gQn0J8a8nicy6n",
                },
            },
            include: {
                Set: true,
            },
        });

        console.log("Found workouts:", workouts.length);

        for (const workout of workouts) {
            console.log(`Updating workout ${workout.workout_name} from ${workout.date} to ${today}`);

            // Update the workout date
            await prisma.workout.update({
                where: { workout_id: workout.workout_id },
                data: { date: today },
            });

            // Update all associated sets to today as well
            await prisma.set.updateMany({
                where: { workout_id: workout.workout_id },
                data: { date: today },
            });
        }

        console.log("All workout dates updated to today!");

        // Show the updated workouts
        const updatedWorkouts = await prisma.workout.findMany({
            where: {
                routine: {
                    user_id: "user_2mmt2YuDA7jJ1gQn0J8a8nicy6n",
                },
            },
            include: {
                Set: true,
            },
        });

        console.log("Updated workouts:");
        updatedWorkouts.forEach(workout => {
            console.log(`- ${workout.workout_name}: ${workout.date}, Total calories: ${workout.total_calories_burned}`);
            workout.Set.forEach((set, index) => {
                console.log(
                    `  Set ${index + 1}: ${set.set_reps} reps @ ${set.set_weight}kg, Calories: ${set.calories_burned}`
                );
            });
        });
    } catch (error) {
        console.error("Error updating workout dates:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateWorkoutDates();
