import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

async function getUserHistory(userId: string): Promise<string[]> {
    try {
        const user = await prisma.userChatHistory.findUnique({
            where: { userId },
        });
        return user?.messages || [];
    } catch (error) {
        console.error("Error fetching user history:", error);
        return [];
    }
}

async function getUserWorkoutHistory(userId: string, days: number = 30): Promise<string> {
    try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        // Get user's routines with workouts and sets
        const routines = await prisma.routine.findMany({
            where: { user_id: userId },
            include: {
                Workout: {
                    where: {
                        date: {
                            gte: daysAgo,
                        },
                    },
                    include: {
                        Set: true,
                    },
                    orderBy: {
                        date: "desc",
                    },
                },
            },
        });

        if (!routines.length) {
            return "No workout history found.";
        }

        // Check if we have any workouts at all
        const hasAnyWorkouts = routines.some(routine => routine.Workout.length > 0);
        if (!hasAnyWorkouts) {
            return "No workouts found in the last 30 days.";
        }

        let historyText = `User's Workout History (Last ${days} days):\n\n`;

        // Group workouts by date for better organization
        const workoutsByDate: { [key: string]: any[] } = {};

        for (const routine of routines) {
            for (const workout of routine.Workout) {
                const dateKey = new Date(workout.date).toISOString().split("T")[0];
                if (!workoutsByDate[dateKey]) {
                    workoutsByDate[dateKey] = [];
                }
                workoutsByDate[dateKey].push({
                    ...workout,
                    routineName: routine.routine_name,
                });
            }
        }

        // Sort dates in descending order (most recent first)
        const sortedDates = Object.keys(workoutsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        for (const dateKey of sortedDates) {
            const workoutDate = new Date(dateKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            let dateDisplay = workoutDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            // Add relative date labels
            if (dateKey === today.toISOString().split("T")[0]) {
                dateDisplay += " (Today)";
            } else if (dateKey === yesterday.toISOString().split("T")[0]) {
                dateDisplay += " (Yesterday)";
            }

            historyText += `📅 ${dateDisplay}\n`;

            for (const workout of workoutsByDate[dateKey]) {
                historyText += `  💪 ${workout.workout_name} (${workout.routineName} routine)\n`;

                if (workout.Set.length > 0) {
                    historyText += `    Sets: `;
                    const setSummary = workout.Set.map(
                        (set: any) =>
                            `${set.set_reps} reps @ ${set.set_weight}kg${
                                set.calories_burned ? ` (${set.calories_burned} cal)` : ""
                            }`
                    ).join(", ");
                    historyText += setSummary + "\n";
                }

                if (workout.total_calories_burned) {
                    historyText += `    🔥 Total Calories: ${workout.total_calories_burned} kcal\n`;
                }

                if (workout.duration_minutes) {
                    historyText += `    ⏱️ Duration: ${workout.duration_minutes} minutes\n`;
                }

                if (workout.notes) {
                    historyText += `    📝 Notes: ${workout.notes}\n`;
                }

                historyText += "\n";
            }
            historyText += "\n";
        }

        return historyText;
    } catch (error) {
        console.error("Error fetching workout history:", error);
        return "Error retrieving workout history.";
    }
}

async function updateUserHistory(userId: string, messages: string[]): Promise<void> {
    try {
        await prisma.userChatHistory.upsert({
            where: { userId },
            update: { messages },
            create: { userId, messages },
        });
    } catch (error) {
        console.error("Error updating user history:", error);
    }
}

export async function* processTextWithLangChainStream(textInput: string, userId: string) {
    const llm = new ChatGroq({
        model: "llama3-70b-8192",
        temperature: 0.6,
        maxRetries: 2,
        apiKey: process.env.GROQ_API_KEY,
        streaming: true,
        
    });

    try {
        // Retrieve user's conversation history and fitness profile from Prisma
        let userHistory = await getUserHistory(userId);

        // Get user's fitness profile and workout history for personalized responses
        const userProfile = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                current_weight: true,
                height: true,
                goal_weight: true,
                fitness_goal: true,
                profile_complete: true,
            },
        });

        // Get workout history for context
        const workoutHistory = await getUserWorkoutHistory(userId, 30);

        // Add current input to history as structured message (temporarily for context)
        const userMessageObj = JSON.stringify({ text: textInput, isUser: true });
        userHistory.push(userMessageObj);

        // Keep only the last 100 messages (50 user + 50 AI pairs) to manage context size
        // This provides much more conversation history while still being manageable
        userHistory = userHistory.slice(-100);

        // Don't update history in Prisma here - let the chat component handle it
        // This prevents duplicate messages

        // Parse history for context (extract text content only)
        const recentHistory = userHistory
            .map(msg => {
                try {
                    const parsed = JSON.parse(msg);
                    return parsed.text;
                } catch {
                    return msg; // Fallback for legacy format
                }
            })
            .join("\n");

        // Create personalized context based on user's fitness profile and workout history
        let personalizedContext = "";
        if (userProfile && userProfile.profile_complete) {
            personalizedContext = `
User's Fitness Profile:
- Current Weight: ${userProfile.current_weight}kg
- Height: ${userProfile.height}cm
- Goal Weight: ${userProfile.goal_weight}kg
- Fitness Goal: ${userProfile.fitness_goal?.replace("_", " ")}

${workoutHistory}

Use this information to provide personalized calorie estimates, fitness advice, and answer questions about their workout history.
For calorie calculations, consider the user's weight (${userProfile.current_weight}kg) in your estimates.
When asked about their workout history, refer to the specific workouts, dates, sets, and weights listed above.
`;
        } else {
            personalizedContext = `
${workoutHistory}

Use this workout history to answer questions about the user's past workouts.
`;
        }

        // First, determine the intent
        const intentTemplate = `
You are an intelligent fitness assistant. Analyze the user's input and determine if this is:
1. A workout/routine management command (return "workout_command")
2. A general fitness question (return "fitness_question")
3. A workout history inquiry (return "history_question")

Examples of history questions:
- "What workouts did I do yesterday?"
- "How many squats did I do this week?"
- "What was my last leg workout?"
- "Show me my workout history"
- "What exercises did I do on Monday?"

User input: "${textInput}"

Respond with only one word: either "workout_command", "fitness_question", or "history_question"
`;

        const intentPrompt = ChatPromptTemplate.fromMessages([
            ["system", intentTemplate],
            ["user", "{input}"],
        ]);

        const intentChain = intentPrompt.pipe(llm);
        const intentResult = await intentChain.invoke({ input: textInput });
        const intent = intentResult.content.toString().trim().toLowerCase();

        yield { type: "intent", intent: intent };

        if (intent === "fitness_question") {
            // Stream fitness advice response
            const fitnessTemplate = `
You are a knowledgeable fitness coach. Provide helpful, accurate fitness advice.
Keep responses conversational, informative, and actionable.

IMPORTANT: Format your response using Markdown for better readability:
- Use **bold** for emphasis on key points
- Use bullet points (-) for lists
- Use numbered lists (1.) for step-by-step instructions
- Use ## for section headers when organizing longer responses
- Use \`inline code\` for exercise names or specific terms
- Use > for important quotes or tips

${personalizedContext}

Recent conversation:
${recentHistory}

User question: {input}

Provide a well-formatted markdown response with clear structure and emphasis:
`;

            const fitnessPrompt = ChatPromptTemplate.fromMessages([
                ["system", fitnessTemplate],
                ["user", "{input}"],
            ]);

            const fitnessChain = fitnessPrompt.pipe(llm);
            const stream = await fitnessChain.stream({
                input: textInput,
            });

            let fullResponse = "";
            for await (const chunk of stream) {
                const content = chunk.content;
                if (content) {
                    fullResponse += content;
                    yield {
                        type: "fitness_response_chunk",
                        content: content,
                        fullResponse: fullResponse,
                    };
                    // Add a small delay for natural typing effect
                    await new Promise(resolve => setTimeout(resolve, 25));
                }
            }

            yield {
                type: "fitness_response_complete",
                fullResponse: fullResponse,
            };
        } else if (intent === "history_question") {
            // Stream workout history response
            const historyTemplate = `
You are a helpful fitness assistant with access to the user's complete workout history.
Answer questions about their past workouts, progress, and patterns based on the data provided.
Be specific about dates, exercises, sets, reps, and weights when available.
If they ask about a specific day and no workout is found, let them know they didn't work out that day.

IMPORTANT: Format your response using Markdown for better readability:
- Use **bold** for exercise names and important numbers
- Use bullet points (-) for listing exercises or sets
- Use numbered lists (1.) for chronological information
- Use ## for date headers when showing multiple days
- Use \`inline code\` for specific weights, reps, or calories
- Use tables when comparing multiple workouts or progress
- Use > for highlighting achievements or important observations

${personalizedContext}

Recent conversation:
${recentHistory}

User's question about their workout history: {input}

Provide a detailed, well-formatted markdown response based on their actual workout data:
`;

            const historyPrompt = ChatPromptTemplate.fromMessages([
                ["system", historyTemplate],
                ["user", "{input}"],
            ]);

            const historyChain = historyPrompt.pipe(llm);
            const stream = await historyChain.stream({
                input: textInput,
            });

            let fullResponse = "";
            for await (const chunk of stream) {
                const content = chunk.content;
                if (content) {
                    fullResponse += content;
                    yield {
                        type: "fitness_response_chunk",
                        content: content,
                        fullResponse: fullResponse,
                    };
                    // Add a small delay for natural typing effect
                    await new Promise(resolve => setTimeout(resolve, 25));
                }
            }

            yield {
                type: "fitness_response_complete",
                fullResponse: fullResponse,
            };
        } else {
            // Handle workout commands with structured response
            const workoutTemplate = `
You are an intelligent fitness assistant. Extract workout data from user input.

Context from recent conversation:
${recentHistory}

Return a JSON object with this structure:
- action: Must be one of these exact values: "log_workout", "add_workout", "add_multiple_workouts", "create_routine", "delete_routine", "delete_workout", "delete_set"
- workoutName: Array of exercise names (can be multiple for bulk operations)
- sets: Array of set objects with 'reps', 'weight' (weight in kg), and 'calories' properties. If calories not mentioned, estimate based on exercise type, weight, and reps
- routineName: Name of the routine (if applicable)
- date: ISO date string (ONLY if user mentioned a specific date like "yesterday" or "on Monday", otherwise ALWAYS use today's date: ${
                new Date().toISOString().split("T")[0]
            })
- totalCalories: Estimated total calories burned for the entire workout session

Guidelines for action selection:
- Use "add_multiple_workouts" when user wants to add several exercises to a routine
- Use "add_workout" for single exercise addition
- For requests like "add these workouts", "add squats, leg press, lunges", or "add this workouts" use "add_multiple_workouts"

IMPORTANT: When the user asks to add workouts mentioned in previous conversation, extract all exercise names mentioned:
- Example: If previous message mentioned "Squats", "Leg Press", "Lunges", "Leg Extensions"
- Return workoutName as: ["Squats", "Leg Press", "Lunges", "Leg Extensions"]

${personalizedContext}

User input: {input}

Respond with ONLY the JSON object, no additional text.
`;

            const workoutPrompt = ChatPromptTemplate.fromMessages([
                ["system", workoutTemplate],
                ["user", "{input}"],
            ]);

            const workoutChain = workoutPrompt.pipe(llm);
            const workoutResult = await workoutChain.invoke({ input: textInput });

            try {
                const responseContent = workoutResult.content.toString();
                console.log("AI Response for workout extraction:", responseContent);
                let parsedData = JSON.parse(responseContent);
                console.log("Parsed workout data:", parsedData);

                // Fallback: If workoutName is empty but user mentioned workouts in conversation
                if (
                    (!parsedData.workoutName || parsedData.workoutName.length === 0) &&
                    (parsedData.action === "add_multiple_workouts" || parsedData.action === "add_workout")
                ) {
                    // Extract workout names from recent conversation
                    const workoutKeywords = [
                        "squats",
                        "leg press",
                        "lunges",
                        "leg extensions",
                        "bench press",
                        "deadlift",
                        "overhead press",
                    ];
                    const foundWorkouts: string[] = [];

                    for (const line of recentHistory.split("\n")) {
                        for (const keyword of workoutKeywords) {
                            if (line.toLowerCase().includes(keyword.toLowerCase())) {
                                const properName = keyword
                                    .split(" ")
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ");
                                if (!foundWorkouts.includes(properName)) {
                                    foundWorkouts.push(properName);
                                }
                            }
                        }
                    }

                    if (foundWorkouts.length > 0) {
                        parsedData.workoutName = foundWorkouts;
                        console.log("Extracted workouts from conversation:", foundWorkouts);
                    }
                }

                // Force current date if no date provided
                const currentDate = new Date().toISOString().split("T")[0];
                if (!parsedData.date || parsedData.date.includes("2023-")) {
                    parsedData.date = currentDate;
                }

                yield {
                    type: "workout_data",
                    data: parsedData,
                };
            } catch (error) {
                console.error("Error parsing workout data:", error);
                yield {
                    type: "error",
                    message: "Could not parse workout data. Please try again.",
                };
            }
        }
    } catch (error) {
        console.error("Error during streaming processing:", error);
        yield {
            type: "error",
            message: "Error during conversation processing.",
        };
    } finally {
        await prisma.$disconnect();
    }
}
