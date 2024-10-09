import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { ChatGroq } from "@langchain/groq";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

const memory = new BufferMemory({
  chatHistory: new ChatMessageHistory(),
  returnMessages: true, // Ensure messages are returned and tracked
});

export async function processTextWithLangChain(textInput: any, userId: any) {
  // const llm = new ChatGoogleGenerativeAI({
  //   model: "gemini-1.5-pro",
  //   temperature: 0.6,
  //   maxRetries: 2,
  //   apiKey: "AIzaSyC1cPd0rm9J7ryljjTfVlLBaKA6Go8xBdE",
  // });
  // const llm = new ChatMistralAI({
  //   model: "mistral-large-latest",
  //   temperature: 0.6,
  //   maxRetries: 2,
  //   apiKey: process.env.MISTRAL_API_KEY,
  // });

  const llm = new ChatGroq({
    model: "mixtral-8x7b-32768",
    temperature: 0.6,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY,
  });

  const conversation = new ConversationChain({
    llm: llm,
    memory: memory,
  });

  const prompt = `
    You are an intelligent fitness assistant. Your job is to help parse user input into structured workout data.

    The user will give you workout details, like exercises they did, sets, weights, or routines, and potentially the date.

    I need you to extract the following details from the user's input:
    - action: What the user wants to do (log_workout, create_routine, add_workout)
    - workoutName: The name of the exercise(s).In the form of Array.
    - sets: The number of sets the user performed in the form of Array of set object {reps:reps, weight:weight in kg}.Number of elements in array equal to number of sets.
    - routineName: The name of the routine (if applicable).
    - date: If the user mentioned a specific date, use it. Otherwise, default to today's date.

    Keep track of previous routines or workouts in the memory to assist the user.

    Input: ${textInput}

    Please respond with the JSON result and don't add any comments in the response.
  `;

  let responses;
  try {
    responses = await conversation.call({
      input: prompt,
    });
  } catch (error) {
    console.error("Error during conversation:", error);
    return { error: "Error during conversation processing." };
  }

  let cleanedResponse = responses.response.replace(/```json|```/g, "");

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error parsing LangChain response:", error);
    parsedData = { error: "Could not parse the response. Please try again." };
  }

  const currentDate = new Date().toISOString().split("T")[0];
  if (!parsedData.Date) {
    parsedData.date = currentDate;
  }

  console.log(parsedData);
  return parsedData;
}
