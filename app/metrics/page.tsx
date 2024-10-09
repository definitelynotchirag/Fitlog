"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

// Tailwind styles for UI customization
const containerStyle =
  "fixed inset-0 flex justify-center items-center bg-slate-900";
const boxStyle =
  "bg-black rounded-lg shadow-lg p-6 w-full max-w-md h-[80vh] flex flex-col";
const contentStyle = "flex-grow overflow-y-auto";
const titleStyle = "font-bold text-2xl mb-6 text-center text-blue-500";
const subtitleStyle = "font-bold text-lg mb-4 text-white";
const itemStyle =
  "bg-gray-800 hover:bg-gray-700 cursor-pointer p-3 rounded-lg mb-2 text-white";
const emptyStateStyle = "text-gray-500 italic";
const buttonStyle =
  "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition";

// Main Dashboard Component
const Dashboard = () => {
  const [routines, setRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [user, setUser] = useState("");

  const adduser = async () => {
    try {
      const response = await axios.post("/api/user/createuser");
      console.log(response.data);
      setUser(response.data.data.user_id);
    } catch (error: any) {
      toast.error("");
    }
  };

  useEffect(() => {
    adduser();
  }, []);

  // Routine List Component
  const RoutineList = ({ routines, selectRoutine }) => (
    <div>
      <h2 className={subtitleStyle}>Your Routines</h2>
      {routines.length ? (
        routines.map((routine) => (
          <div
            key={routine.routine_id}
            className={itemStyle}
            onClick={() => selectRoutine(routine)}
          >
            {routine.routine_name}
          </div>
        ))
      ) : (
        <p className={emptyStateStyle}>No routines available</p>
      )}
    </div>
  );

  // Workout List Component
  const WorkoutList = ({ workouts, selectWorkout }) => (
    <div>
      <h2 className={subtitleStyle}>Workouts</h2>
      {workouts.length ? (
        workouts.map((workout) => (
          <div
            key={workout.workout_id}
            className={itemStyle}
            onClick={() => selectWorkout(workout)}
          >
            {workout.workout_name} -{" "}
            {new Date(workout.date).toLocaleDateString()}
          </div>
        ))
      ) : (
        <p className={emptyStateStyle}>No workouts available</p>
      )}
    </div>
  );

  // Set List Component
  const SetList = ({ sets }) => (
    <div>
      <h2 className={subtitleStyle}>Sets</h2>
      {sets.length ? (
        sets.map((set, index) => (
          <div key={index} className={itemStyle}>
            Set {index + 1}: {set.set_reps} reps with {set.set_weight} kg
          </div>
        ))
      ) : (
        <p className={emptyStateStyle}>No sets available</p>
      )}
    </div>
  );

  useEffect(() => {
    // Fetch the user's routines
    axios
      .get("/api/routine/displayroutines")
      .then((res) => setRoutines(res.data.routines))
      .catch((err) => {
        console.error("Error fetching routines:", err);
        toast.error("Failed to fetch routines");
      });
  }, []);

  const selectRoutine = (routine) => {
    const routineId = routine.routine_id;
    setSelectedRoutine(routine);
    setSelectedWorkout(null); // Reset workout and sets
    axios
      .post(`/api/workouts/displayworkouts`, { routineId })
      .then((res) => setWorkouts(res.data.workouts))
      .catch((err) => {
        console.error("Error fetching workouts:", err);
        toast.error("Failed to fetch workouts");
      });
  };

  const selectWorkout = (workout) => {
    const workoutId = workout.workout_id;
    setSelectedWorkout(workout);
    axios
      .post(`/api/sets/displaysets`, { workoutId })
      .then((res) => setSets(res.data.sets))
      .catch((err) => {
        console.error("Error fetching sets:", err);
        toast.error("Failed to fetch sets");
      });
  };

  return (
    <div className={containerStyle}>
      <div className={boxStyle}>
        <h1 className={titleStyle}>Dashboard</h1>
        <div className={contentStyle}>
          {!selectedRoutine ? (
            <RoutineList routines={routines} selectRoutine={selectRoutine} />
          ) : !selectedWorkout ? (
            <WorkoutList workouts={workouts} selectWorkout={selectWorkout} />
          ) : (
            <SetList sets={sets} />
          )}
        </div>

        <div className="mt-4 flex flex-col space-y-2">
          {selectedRoutine && (
            <button
              className={buttonStyle}
              onClick={() => setSelectedRoutine(null)}
            >
              Back to Routines
            </button>
          )}

          {selectedWorkout && (
            <button
              className={buttonStyle}
              onClick={() => setSelectedWorkout(null)}
            >
              Back to Workouts
            </button>
          )}

          <Link className={`${buttonStyle} text-center`} href="/">
            Chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
