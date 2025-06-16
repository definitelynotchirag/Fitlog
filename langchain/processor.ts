import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { PrismaClient } from "@prisma/client";
import { LLMChain } from "langchain/chains";

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

export async function processTextWithLangChain(textInput: string, userId: string) {
    const llm = new ChatGroq({
        model: "llama3-70b-8192",
        temperature: 0.6,
        maxRetries: 2,
        apiKey: process.env.GROQ_API_KEY,
    });

    // Retrieve user's conversation history and fitness profile from Prisma
    let userHistory = await getUserHistory(userId);

    // Get user's fitness profile for personalized responses
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

    // Add current input to history
    userHistory.push(textInput);

    // Keep only the last 5 interactions to manage context size
    userHistory = userHistory.slice(-5);

    // Update user history in Prisma
    await updateUserHistory(userId, userHistory);

    const recentHistory = userHistory.join("\n");

    // Create personalized context based on user's fitness profile
    let personalizedContext = "";
    if (userProfile && userProfile.profile_complete) {
        personalizedContext = `
User's Fitness Profile:
- Current Weight: ${userProfile.current_weight}kg
- Height: ${userProfile.height}cm
- Goal Weight: ${userProfile.goal_weight}kg
- Fitness Goal: ${userProfile.fitness_goal?.replace("_", " ")}

Use this information to provide personalized calorie estimates and fitness advice.
For calorie calculations, consider the user's weight (${userProfile.current_weight}kg) in your estimates.
`;
    }

    const systemTemplate = `
You are an intelligent fitness assistant. Your job is to help with both workout data management and general fitness questions.

First, determine if the user's input is:
1. A workout/routine management command (needs structured data)
2. A general fitness question (needs conversational response)

For workout management commands, return a JSON object with this structure:
- action: Must be one of these exact values: "log_workout", "add_workout", "create_routine", "delete_routine", "delete_workout", "delete_set"
- workoutName: Array of exercise names
- sets: Array of set objects with 'reps', 'weight' (weight in kg), and 'calories' properties. If calories not mentioned, estimate based on exercise type, weight, and reps
- routineName: Name of the routine (if applicable)
- date: ISO date string (ONLY if user mentioned a specific date like "yesterday" or "on Monday", otherwise ALWAYS use today's date: ${
        new Date().toISOString().split("T")[0]
    })
- totalCalories: Estimated total calories burned for the entire workout session

Calorie estimation guidelines:
- For strength training: approximately 0.5-1.5 calories per rep depending on exercise intensity and weight
- Compound exercises (squats, deadlifts, bench press): higher calorie burn (1-2 calories per rep)
- Isolation exercises (bicep curls, tricep extensions): lower calorie burn (0.3-0.8 calories per rep)
- Cardio exercises: estimate based on intensity and duration
- Consider user's body weight for accurate calculations: heavier users burn more calories
${personalizedContext}

For general fitness questions, return a JSON object with this structure:
- action: "fitness_question"
- response: A helpful, informative answer to the user's fitness question

Action mapping rules:
- log_workout: User logged, recorded, saved, did, completed, or finished workout data
- add_workout: User wants to add, create, or make new workout to existing routine
- create_routine: User wants to create, add, or make new routine
- delete_routine: User wants to delete, remove, or erase routine
- delete_workout: User wants to delete, remove, or erase workout from routine
- delete_set: User wants to delete, remove, or erase sets from workout
- fitness_question: User asks about fitness advice, exercise form, nutrition, training tips, muscle groups, etc.

Examples of fitness questions:
- "How do I improve my squat form?"
- "What exercises target the chest?"
- "How many calories should I eat to build muscle?"
- "What's the difference between compound and isolation exercises?"
- "How often should I train legs?"

Recent conversation history:
{history}

User ID: {userId}

${personalizedContext}

Please respond with ONLY the JSON object, no additional text or comments.

`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemTemplate],
        ["user", "{input}"],
    ]);

    const chain = new LLMChain({ llm: llm, prompt: promptTemplate });

    try {
        const result = await chain.call({
            history: recentHistory,
            input: textInput,
            userId: userId,
        });

        let parsedData;
        try {
            parsedData = JSON.parse(result.text);
        } catch (error) {
            console.error("Error parsing LLM response:", error);
            parsedData = { error: "Could not parse the response. Please try again." };
        }

        const currentDate = new Date().toISOString().split("T")[0];
        // Force current date if no date provided or if AI used a default/example date
        if (
            !parsedData.date ||
            parsedData.date.includes("2023-") ||
            parsedData.date === "2023-02-20T00:00:00.000Z" ||
            parsedData.date === "2023-03-17T00:00:00.000Z"
        ) {
            parsedData.date = currentDate;
        }

        console.log(parsedData);
        return parsedData;
    } catch (error) {
        console.error("Error during LLM processing:", error);
        return { error: "Error during conversation processing." };
    } finally {
        await prisma.$disconnect();
    }
}
