import { ChatGroq } from "@langchain/groq";
import { LLMChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
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

async function updateUserHistory(
  userId: string,
  messages: string[],
): Promise<void> {
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

export async function processTextWithLangChain(
  textInput: string,
  userId: string,
) {
  const llm = new ChatGroq({
    model: "mixtral-8x7b-32768",
    temperature: 0.6,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY,
  });

  // Retrieve user's conversation history from Prisma
  let userHistory = await getUserHistory(userId);

  // Add current input to history
  userHistory.push(textInput);

  // Keep only the last 5 interactions to manage context size
  userHistory = userHistory.slice(-5);

  // Update user history in Prisma
  await updateUserHistory(userId, userHistory);

  const recentHistory = userHistory.join("\n");

  const systemTemplate = `
You are an intelligent fitness assistant. Your job is to help parse user input into structured workout data.
The user will give you workout details, like exercises they did, sets, weights, or routines, and potentially the date.
I need you to extract the following details from the user's input:
- action: What the user wants to do (log_workout, create_routine,delete_routine, add_workout, create_workout, delete_workout, delete_set)
- workoutName: The name of the exercise(s). In the form of Array.
- sets: The number of sets date, use it. Otherwise, default to today's date.

Recent conversation history: the user performed in the form of Array of set object with 'reps' and 'weight' (in kg) properties. Number of elements in array equal to number of sets.
- routineName: The name of the routine (if applicable).
- date: If the user mentioned a specific
{history}

User ID: {userId}

Please respond with the JSON result and don't add any comments in the response.
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
    if (!parsedData.date) {
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
