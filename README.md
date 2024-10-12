# Fitlog - GenAI-based Workout Tracker

Fitlog is a GenAI-powered workout tracking application that allows users to log their routines, workouts, and sets. The app includes features like fuzzy search for routine and workout names, powered by Fuse.js, and integrates Prisma for database management. This is a MERN-stack application built using Next.js for server-side rendering.

## Features

- **User Authentication**: User signup and login using Clerk.
- **Routine and Workout Tracking**: Create routines, log workouts, and track sets.
- **Fuzzy Search**: Implements fuzzy search with Fuse.js for retrieving routine and workout IDs based on user input.
- **AI Chat Integration**: Chat with an AI-powered assistant to log workouts and get fitness insights.
- **Responsive UI**: Built with Mantine UI and styled with Tailwind CSS for a modern and responsive design.

## Technologies Used

- **Next.js**: React framework for building server-rendered applications.
- **Prisma**: ORM for interacting with a PostgreSQL database.
- **Clerk**: Authentication service for handling user sessions.
- **Fuse.js**: Fuzzy search functionality to enhance search experience for routines and workouts.
- **Mantine UI**: UI library for modern React components.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **TypeScript**: For static type-checking in the project.
- **LangChain**: AI integration for chat-based workout assistance.

## Database Schema

Here is the database schema for tracking user routines, workouts, and sets:

- **User**: Contains `user_id`, `username`, and `password`.
- **Routine**: Contains `routine_id`, `routine_name`, and `user_id`. A routine has multiple workouts.
- **Workout**: Contains `workout_id`, `workout_name`, `routine_id`, and `date`. A workout has multiple sets.
- **Set**: Contains `set_id`, `set_weight`, `set_reps`, `workout_id`, and `date`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitlog.git
2. Navigate into the project directory:

    ```bash
  
    cd fitlog
    ```

3. Install dependencies:

    ```bash
  
    npm install
    ```

4. Set up environment variables by creating a .env file. Add your Prisma database URL, Clerk credentials, and other required environment variables:

   ```bash
   DATABASE_URL="your_postgres_database_url"
   NEXT_PUBLIC_CLERK_FRONTEND_API="your_clerk_frontend_api"
   CLERK_API_KEY="your_clerk_api_key"
   GROQ_API_KEY="Groq Api Key"
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
   ```

5. Apply Prisma migrations to your database:

    ```bash
    
    npx prisma migrate dev
    ```

6. Run the development server:

    ```bash
    
    npm run dev
    ```
Open your browser and go to http://localhost:3000 to see the app in action.


**License**

This project is licensed under the MIT License - see the LICENSE file for details.

**Contributing**

Feel free to fork the repository and submit pull requests. Contributions are welcome!

**Future Enhancements**

    Advanced Analytics: Integrate charts and analytics for users to visualize their workout progress.
    GenAI Improvements: Enhance the AI assistant with personalized workout recommendations.
    Mobile App: Plan to extend the web app into a mobile application using React Native.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
