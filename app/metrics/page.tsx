"use client";
import { UserButton } from "@clerk/nextjs";
import axios from "axios";
import { eachDayOfInterval, format, getDay, isSameDay, subDays } from "date-fns";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Tailwind styles for UI customization
const containerStyle = "fixed inset-0 flex justify-center items-center bg-slate-900 p-4";
const boxStyle =
    "glassmorphism rounded-2xl shadow-2xl p-6 w-full max-w-6xl h-[90vh] flex flex-col border border-slate-800 backdrop-blur-lg";
const contentStyle = "flex-grow overflow-y-auto custom-scrollbar";
const titleStyle = "font-extrabold text-3xl mb-6 text-blue-400 tracking-tight drop-shadow-lg font-bricolage-grotesque";
const subtitleStyle = "font-bold text-lg mb-4 text-white font-bricolage-grotesque";
const itemStyle =
    "bg-slate-800/80 hover:bg-blue-600/30 cursor-pointer p-4 rounded-xl mb-3 text-white border border-blue-900/20 shadow transition-all duration-150";
const emptyStateStyle = "text-gray-500 italic";
const buttonStyle = "px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow font-medium";

// Main Dashboard Component
const Dashboard = () => {
    const [routines, setRoutines] = useState([]);
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [sets, setSets] = useState([]);
    const [user, setUser] = useState("");
    const [calorieData, setCalorieData] = useState(null);
    const [showCalories, setShowCalories] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("calendar"); // "workouts", "calendar", "calories", "profile", "analytics"
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editableProfile, setEditableProfile] = useState({
        current_weight: "",
        height: "",
        goal_weight: "",
        fitness_goal: "",
    });
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [streakData, setStreakData] = useState<any[]>([]);
    const [strengthData, setStrengthData] = useState<any[]>([]);
    const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, any>>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<any[]>([]);

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

    // Fetch workouts grouped by date using existing APIs
    const fetchWorkoutsByDate = async () => {
        try {
            // First get all routines
            const routinesResponse = await axios.get("/api/routine/displayroutines");
            const allRoutines = routinesResponse.data.routines || routinesResponse.data.data || [];

            // Then get all workouts for each routine
            const allWorkoutsPromises = allRoutines.map(async (routine: any) => {
                try {
                    const workoutsResponse = await axios.post("/api/workouts/displayworkouts", {
                        routineId: routine.routine_id,
                    });
                    return (workoutsResponse.data.workouts || []).map((workout: any) => ({
                        ...workout,
                        routine_name: routine.routine_name,
                    }));
                } catch (error) {
                    console.error(`Error fetching workouts for routine ${routine.routine_name}:`, error);
                    return [];
                }
            });

            const allWorkoutsArrays = await Promise.all(allWorkoutsPromises);
            const allWorkouts = allWorkoutsArrays.flat();

            // Group workouts by date
            const workoutsByDate: Record<string, any[]> = {};

            for (const workout of allWorkouts) {
                const workoutDate = new Date(workout.date);
                const dateKey = workoutDate.toISOString().split("T")[0]; // YYYY-MM-DD format

                if (!workoutsByDate[dateKey]) {
                    workoutsByDate[dateKey] = [];
                }

                // Get sets count for this workout
                try {
                    const setsResponse = await axios.post("/api/sets/displaysets", {
                        workoutId: workout.workout_id,
                    });
                    const sets = setsResponse.data.sets || [];

                    const workoutWithSets = {
                        workout_id: workout.workout_id,
                        workout_name: workout.workout_name,
                        routine_name: workout.routine_name,
                        date: workout.date,
                        duration_minutes: workout.duration_minutes,
                        notes: workout.notes,
                        total_calories_burned: workout.total_calories_burned,
                        workout_type: workout.workout_type,
                        sets_count: sets.length,
                        total_reps: sets.reduce((sum: number, set: any) => sum + set.set_reps, 0),
                        total_weight: sets.reduce((sum: number, set: any) => sum + set.set_weight * set.set_reps, 0),
                    };

                    workoutsByDate[dateKey].push(workoutWithSets);
                } catch (error) {
                    console.error(`Error fetching sets for workout ${workout.workout_name}:`, error);
                    // Add workout without sets data
                    workoutsByDate[dateKey].push({
                        workout_id: workout.workout_id,
                        workout_name: workout.workout_name,
                        routine_name: workout.routine_name,
                        date: workout.date,
                        duration_minutes: workout.duration_minutes,
                        notes: workout.notes,
                        total_calories_burned: workout.total_calories_burned,
                        workout_type: workout.workout_type,
                        sets_count: 0,
                        total_reps: 0,
                        total_weight: 0,
                    });
                }
            }

            setWorkoutsByDate(workoutsByDate);

            // Set workouts for today as default
            const today = new Date().toISOString().split("T")[0];
            setSelectedDateWorkouts(workoutsByDate[today] || []);
        } catch (error) {
            console.error("Error fetching workouts by date:", error);
            toast.error("Failed to fetch workout calendar");
        }
    };

    // Handle calendar date selection
    const handleDateSelect = (value: any) => {
        if (value instanceof Date) {
            setSelectedDate(value);
            const dateKey = value.toISOString().split("T")[0];
            setSelectedDateWorkouts(workoutsByDate[dateKey] || []);
        }
    };

    // Check if a date has workouts
    const hasWorkoutOnDate = (date: Date) => {
        const dateKey = date.toISOString().split("T")[0];
        return workoutsByDate[dateKey] && workoutsByDate[dateKey].length > 0;
    };

    // Routine List Component
    interface Routine {
        routine_id: string;
        routine_name: string;
    }

    interface RoutineListProps {
        routines: Routine[];
        selectRoutine: (routine: Routine) => void;
    }

    const RoutineList: React.FC<RoutineListProps> = ({ routines, selectRoutine }) => (
        <div>
            <h2 className={subtitleStyle}>Your Routines</h2>
            {routines.length ? (
                routines.map(routine => (
                    <div key={routine.routine_id} className={itemStyle} onClick={() => selectRoutine(routine)}>
                        {routine.routine_name}
                    </div>
                ))
            ) : (
                <p className={emptyStateStyle}>No routines available</p>
            )}
        </div>
    );

    // Workout List Component
    interface Workout {
        workout_id: string;
        workout_name: string;
        date: string;
    }

    interface WorkoutListProps {
        workouts: Workout[];
        selectWorkout: (workout: Workout) => void;
    }

    const WorkoutList: React.FC<WorkoutListProps> = ({ workouts, selectWorkout }) => (
        <div>
            <h2 className={subtitleStyle}>Workouts</h2>
            {workouts.length ? (
                workouts.map(workout => (
                    <div key={workout.workout_id} className={itemStyle} onClick={() => selectWorkout(workout)}>
                        {workout.workout_name} - {new Date(workout.date).toLocaleDateString()}
                    </div>
                ))
            ) : (
                <p className={emptyStateStyle}>No workouts available</p>
            )}
        </div>
    );

    // Set List Component
    interface Set {
        set_reps: number;
        set_weight: number;
        calories_burned?: number;
    }

    interface SetListProps {
        sets: Set[];
    }

    const SetList: React.FC<SetListProps> = ({ sets }) => (
        <div>
            <h2 className={subtitleStyle}>Sets</h2>
            {sets.length ? (
                sets.map((set, index) => (
                    <div key={index} className={itemStyle}>
                        <div className="flex justify-between items-center">
                            <span>
                                Set {index + 1}: {set.set_reps} reps with {set.set_weight} kg
                            </span>
                            {set.calories_burned && (
                                <span className="text-orange-400 font-semibold">
                                    {Math.round(set.calories_burned)} kcal
                                </span>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className={emptyStateStyle}>No sets available</p>
            )}
        </div>
    );

    // Calendar View Component
    const CalendarView: React.FC = () => (
        <div className="space-y-6">
            <h2 className={subtitleStyle}>Workout Calendar</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* React Calendar */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Workout Calendar
                    </h3>
                    <div className="calendar-container">
                        <Calendar
                            onChange={handleDateSelect}
                            value={selectedDate}
                            tileClassName={({ date }) => {
                                if (hasWorkoutOnDate(date)) {
                                    return "has-workout";
                                }
                                return "";
                            }}
                            className="react-calendar-dark"
                            tileContent={({ date }) => {
                                const workoutCount = workoutsByDate[date.toISOString().split("T")[0]]?.length || 0;
                                if (workoutCount > 0) {
                                    return (
                                        <div className="workout-indicator">
                                            <span className="workout-count">{workoutCount}</span>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </div>
                </div>

                {/* Selected Date Workouts */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Workouts on {format(selectedDate, "MMMM dd, yyyy")}
                    </h3>
                    {selectedDateWorkouts.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                            {selectedDateWorkouts.map((workout, index) => (
                                <div
                                    key={workout.workout_id}
                                    className="bg-gradient-to-r from-slate-700/50 to-slate-600/30 rounded-xl p-4 border border-slate-600/50 hover:border-blue-400/50 transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-blue-300 text-lg">{workout.workout_name}</h4>
                                        <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded-full">
                                            {workout.routine_name}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                            <span className="text-gray-300">
                                                Sets:{" "}
                                                <span className="text-purple-400 font-semibold">
                                                    {workout.sets_count}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            <span className="text-gray-300">
                                                Reps:{" "}
                                                <span className="text-blue-400 font-semibold">
                                                    {workout.total_reps}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span className="text-gray-300">
                                                Weight:{" "}
                                                <span className="text-green-400 font-semibold">
                                                    {Math.round(workout.total_weight)} kg
                                                </span>
                                            </span>
                                        </div>
                                        {workout.total_calories_burned && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                                <span className="text-gray-300">
                                                    Calories:{" "}
                                                    <span className="text-orange-400 font-semibold">
                                                        {Math.round(workout.total_calories_burned)}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {workout.duration_minutes && (
                                        <div className="text-xs text-gray-400 mt-3 flex items-center gap-2">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Duration: {workout.duration_minutes} minutes
                                        </div>
                                    )}
                                    {workout.notes && (
                                        <div className="text-xs text-gray-400 mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-600/30">
                                            <strong>Notes:</strong> {workout.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg
                                className="w-12 h-12 text-gray-500 mx-auto mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <p className="text-gray-400 italic">No workouts on this date</p>
                            <p className="text-gray-500 text-sm mt-1">Select a date with workouts to see details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    This Month's Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-4 rounded-xl border border-blue-700/30 text-center backdrop-blur-sm hover:from-blue-800/60 hover:to-blue-700/40 transition-all duration-200">
                        <div className="text-3xl font-bold text-blue-400 mb-1">
                            {
                                Object.keys(workoutsByDate).filter(
                                    date =>
                                        new Date(date).getMonth() === new Date().getMonth() &&
                                        new Date(date).getFullYear() === new Date().getFullYear()
                                ).length
                            }
                        </div>
                        <div className="text-sm text-gray-300 font-medium">Workout Days</div>
                        <div className="text-xs text-blue-300 mt-1">Active days</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-4 rounded-xl border border-green-700/30 text-center backdrop-blur-sm hover:from-green-800/60 hover:to-green-700/40 transition-all duration-200">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                            {
                                Object.values(workoutsByDate)
                                    .flat()
                                    .filter(
                                        workout =>
                                            new Date(workout.date).getMonth() === new Date().getMonth() &&
                                            new Date(workout.date).getFullYear() === new Date().getFullYear()
                                    ).length
                            }
                        </div>
                        <div className="text-sm text-gray-300 font-medium">Total Workouts</div>
                        <div className="text-xs text-green-300 mt-1">Sessions completed</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-4 rounded-xl border border-purple-700/30 text-center backdrop-blur-sm hover:from-purple-800/60 hover:to-purple-700/40 transition-all duration-200">
                        <div className="text-3xl font-bold text-purple-400 mb-1">
                            {Object.values(workoutsByDate)
                                .flat()
                                .filter(
                                    workout =>
                                        new Date(workout.date).getMonth() === new Date().getMonth() &&
                                        new Date(workout.date).getFullYear() === new Date().getFullYear()
                                )
                                .reduce((sum, workout) => sum + workout.sets_count, 0)}
                        </div>
                        <div className="text-sm text-gray-300 font-medium">Total Sets</div>
                        <div className="text-xs text-purple-300 mt-1">Sets performed</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-4 rounded-xl border border-orange-700/30 text-center backdrop-blur-sm hover:from-orange-800/60 hover:to-orange-700/40 transition-all duration-200">
                        <div className="text-3xl font-bold text-orange-400 mb-1">
                            {Math.round(
                                Object.values(workoutsByDate)
                                    .flat()
                                    .filter(
                                        workout =>
                                            new Date(workout.date).getMonth() === new Date().getMonth() &&
                                            new Date(workout.date).getFullYear() === new Date().getFullYear()
                                    )
                                    .reduce((sum, workout) => sum + (workout.total_calories_burned || 0), 0)
                            )}
                        </div>
                        <div className="text-sm text-gray-300 font-medium">Calories Burned</div>
                        <div className="text-xs text-orange-300 mt-1">Energy expended</div>
                    </div>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        // Fetch the user's routines
        axios
            .get("/api/routine/displayroutines")
            .then(res => setRoutines(res.data.routines))
            .catch(err => {
                console.error("Error fetching routines:", err);
                toast.error("Failed to fetch routines");
            });
    }, []);

    const selectRoutine = (routine: any) => {
        const routineId = routine.routine_id;
        setSelectedRoutine(routine);
        setSelectedWorkout(null); // Reset workout and sets
        axios
            .post(`/api/workouts/displayworkouts`, { routineId })
            .then(res => setWorkouts(res.data.workouts))
            .catch(err => {
                console.error("Error fetching workouts:", err);
                toast.error("Failed to fetch workouts");
            });
    };

    const selectWorkout = (workout: any) => {
        const workoutId = workout.workout_id;
        setSelectedWorkout(workout);
        axios
            .post(`/api/sets/displaysets`, { workoutId })
            .then(res => setSets(res.data.sets))
            .catch(err => {
                console.error("Error fetching sets:", err);
                toast.error("Failed to fetch sets");
            });
    };

    const fetchCalorieData = async () => {
        if (!user) return;
        try {
            const response = await axios.post("/api/calories", { userId: user });
            setCalorieData(response.data.data);
        } catch (error) {
            console.error("Error fetching calorie data:", error);
            toast.error("Failed to fetch calorie data");
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get("/api/user/fitness-profile");
            setUserProfile(response.data.data);
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const startEditingProfile = () => {
        if (userProfile && (userProfile as any).current_weight) {
            setEditableProfile({
                current_weight: (userProfile as any).current_weight?.toString() || "",
                height: (userProfile as any).height?.toString() || "",
                goal_weight: (userProfile as any).goal_weight?.toString() || "",
                fitness_goal: (userProfile as any).fitness_goal || "",
            });
            setIsEditingProfile(true);
        }
    };

    const cancelEditingProfile = () => {
        setIsEditingProfile(false);
        setEditableProfile({
            current_weight: "",
            height: "",
            goal_weight: "",
            fitness_goal: "",
        });
    };

    const saveProfileChanges = async () => {
        try {
            const profileData = {
                currentWeight: parseFloat(editableProfile.current_weight),
                height: parseFloat(editableProfile.height),
                goalWeight: parseFloat(editableProfile.goal_weight),
                fitnessGoal: editableProfile.fitness_goal,
            };

            console.log("Profile data being sent:", profileData);

            // Validate the data
            if (
                !profileData.currentWeight ||
                !profileData.height ||
                !profileData.goalWeight ||
                !profileData.fitnessGoal
            ) {
                console.log("Validation failed - missing fields:", {
                    currentWeight: !!profileData.currentWeight,
                    height: !!profileData.height,
                    goalWeight: !!profileData.goalWeight,
                    fitnessGoal: !!profileData.fitnessGoal,
                });
                toast.error("Please fill in all fields");
                return;
            }

            if (profileData.currentWeight <= 0 || profileData.height <= 0 || profileData.goalWeight <= 0) {
                toast.error("Weight and height must be positive numbers");
                return;
            }

            if (profileData.height < 100 || profileData.height > 250) {
                toast.error("Please enter height in centimeters (100-250 cm)");
                return;
            }

            console.log("Sending request to API...");
            const response = await axios.post("/api/user/fitness-profile", profileData);

            console.log("API response:", response.data);

            if (response.data.success) {
                setUserProfile(response.data.data);
                setIsEditingProfile(false);
                toast.success("Profile updated successfully!");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error: any) {
            console.error("Error saving profile:", error);

            // Show specific error message from API if available
            if (error.response?.data?.error) {
                toast.error(`Error: ${error.response.data.error}`);
            } else if (error.message) {
                toast.error(`Error: ${error.message}`);
            } else {
                toast.error("Failed to save profile changes");
            }
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            // Fetch real workout history from API
            const response = await axios.get("/api/routine/displayroutines");
            const routinesData = response.data.data || response.data.routines || [];

            // Extract all real workout dates from routines and workouts
            const realWorkoutDates = await fetchAllWorkoutDates(routinesData);

            // Generate streak data for the last 90 days based on real data
            const last90Days = eachDayOfInterval({
                start: subDays(new Date(), 89),
                end: new Date(),
            });

            const streakMap = last90Days.map(date => {
                const workoutsOnDate = realWorkoutDates.filter(workoutDate => isSameDay(new Date(workoutDate), date));
                return {
                    date: format(date, "yyyy-MM-dd"),
                    value: workoutsOnDate.length, // Actual number of workouts on that date
                    day: getDay(date),
                };
            });

            setStreakData(streakMap);

            // Generate strength progression data based on real sets data
            const strengthProgress = await generateRealStrengthData(routinesData);
            setStrengthData(strengthProgress);

            // Set analytics summary with real data
            setAnalyticsData({
                currentStreak: calculateCurrentStreak(realWorkoutDates),
                longestStreak: calculateLongestStreak(realWorkoutDates),
                totalWorkouts: realWorkoutDates.length,
                averageWorkoutsPerWeek: calculateWeeklyAverage(realWorkoutDates),
            });
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            // Fallback to empty data
            setAnalyticsData({
                currentStreak: 0,
                longestStreak: 0,
                totalWorkouts: 0,
                averageWorkoutsPerWeek: "0.0",
            });
            setStreakData([]);
            setStrengthData([]);
        }
    };

    const fetchAllWorkoutDates = async (routinesData: any[]) => {
        const allWorkoutDates: Date[] = [];

        try {
            // Fetch all workouts for each routine
            for (const routine of routinesData) {
                const workoutResponse = await axios.post(`/api/workouts/displayworkouts`, {
                    routineId: routine.routine_id,
                });
                const workouts = workoutResponse.data.workouts || [];

                // Extract dates from workouts
                workouts.forEach((workout: any) => {
                    if (workout.date) {
                        allWorkoutDates.push(new Date(workout.date));
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching workout dates:", error);
        }

        return allWorkoutDates;
    };

    const generateRealStrengthData = async (routinesData: any[]) => {
        const strengthExercises = ["squat", "bench", "deadlift", "press", "curl", "pullup"];
        const strengthData = [];

        try {
            // Collect all sets data for strength exercises
            const exerciseData: { [key: string]: { date: Date; weight: number }[] } = {};

            for (const routine of routinesData) {
                const workoutResponse = await axios.post(`/api/workouts/displayworkouts`, {
                    routineId: routine.routine_id,
                });
                const workouts = workoutResponse.data.workouts || [];

                for (const workout of workouts) {
                    // Check if workout name contains strength exercise keywords
                    const workoutName = workout.workout_name.toLowerCase();
                    const matchedExercise = strengthExercises.find(exercise => workoutName.includes(exercise));

                    if (matchedExercise && workout.workout_id) {
                        try {
                            const setsResponse = await axios.post(`/api/sets/displaysets`, {
                                workoutId: workout.workout_id,
                            });
                            const sets = setsResponse.data.sets || [];

                            sets.forEach((set: any) => {
                                if (set.set_weight && set.set_weight > 0) {
                                    if (!exerciseData[matchedExercise]) {
                                        exerciseData[matchedExercise] = [];
                                    }
                                    exerciseData[matchedExercise].push({
                                        date: new Date(workout.date),
                                        weight: parseFloat(set.set_weight),
                                    });
                                }
                            });
                        } catch (setsError) {
                            console.error(`Error fetching sets for workout ${workout.workout_id}:`, setsError);
                        }
                    }
                }
            }

            // Generate weekly strength progression data
            const last12Weeks = [];
            for (let i = 11; i >= 0; i--) {
                const weekStart = subDays(new Date(), i * 7);
                const weekEnd = subDays(new Date(), (i - 1) * 7);
                const weekLabel = format(weekStart, "MMM dd");

                const weekData: any = { week: weekLabel };

                // Calculate average weight for each exercise during this week
                Object.keys(exerciseData).forEach(exercise => {
                    const weekSets = exerciseData[exercise].filter(
                        data => data.date >= weekStart && data.date < weekEnd
                    );

                    if (weekSets.length > 0) {
                        const avgWeight = weekSets.reduce((sum, set) => sum + set.weight, 0) / weekSets.length;
                        weekData[exercise.charAt(0).toUpperCase() + exercise.slice(1)] =
                            Math.round(avgWeight * 10) / 10;
                    }
                });

                last12Weeks.push(weekData);
            }

            return last12Weeks;
        } catch (error) {
            console.error("Error generating real strength data:", error);
            return [];
        }
    };

    const generateMockWorkoutDates = () => {
        const dates = [];
        const today = new Date();

        // Generate workout dates with realistic patterns
        for (let i = 0; i < 90; i++) {
            const date = subDays(today, i);
            const dayOfWeek = getDay(date);

            // Higher chance on weekdays, rest days built in
            let chance = 0.0;
            if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
                // Mon, Wed, Fri
                chance = 0.85;
            } else if (dayOfWeek === 2 || dayOfWeek === 4) {
                // Tue, Thu
                chance = 0.75;
            } else if (dayOfWeek === 6) {
                // Saturday
                chance = 0.6;
            } else {
                // Sunday
                chance = 0.3;
            }

            // Add some consistency patterns (good weeks vs bad weeks)
            const weeksSinceStart = Math.floor(i / 7);
            if (weeksSinceStart % 3 === 0) chance *= 1.2; // Good weeks
            if (weeksSinceStart % 4 === 3) chance *= 0.7; // Occasional bad weeks

            if (Math.random() < Math.min(chance, 1)) {
                dates.push(date);
            }
        }

        return dates;
    };

    const generateStrengthData = () => {
        const exercises = [
            { name: "Squat", baseWeight: 120, progressRate: 2.5 },
            { name: "Bench Press", baseWeight: 80, progressRate: 1.5 },
            { name: "Deadlift", baseWeight: 140, progressRate: 3.0 },
            { name: "Overhead Press", baseWeight: 50, progressRate: 1.0 },
        ];
        const data = [];

        for (let i = 12; i >= 0; i--) {
            const date = subDays(new Date(), i * 7); // Weekly data points
            const week = format(date, "MMM dd");

            const weekData: any = { week };
            exercises.forEach(exercise => {
                // Simulate progressive overload with realistic progression
                const weeksPassed = 12 - i;
                const baseProgress = exercise.baseWeight + weeksPassed * exercise.progressRate;

                // Add some realistic variation (deload weeks, plateaus, etc.)
                let variation = 0;
                if (weeksPassed % 4 === 3) {
                    // Deload week every 4th week
                    variation = -exercise.progressRate * 2;
                } else if (weeksPassed > 8) {
                    // Slower progress after 8 weeks
                    variation = Math.random() * exercise.progressRate - exercise.progressRate / 2;
                } else {
                    variation = Math.random() * (exercise.progressRate / 2);
                }

                weekData[exercise.name] = Math.max(baseProgress + variation, exercise.baseWeight * 0.8);
            });

            data.push(weekData);
        }

        return data;
    };

    const calculateCurrentStreak = (workoutDates: Date[]) => {
        if (workoutDates.length === 0) return 0;

        const today = new Date();
        const sortedDates = workoutDates.map(date => new Date(date)).sort((a, b) => b.getTime() - a.getTime()); // Most recent first

        // Remove duplicate dates (same day workouts)
        const uniqueDates = sortedDates.filter((date, index, arr) => index === 0 || !isSameDay(date, arr[index - 1]));

        if (uniqueDates.length === 0) return 0;

        let currentStreak = 0;
        let checkDate = today;

        // Check if there was a workout today or within the last 2 days
        const recentWorkout = uniqueDates.find(date => {
            const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 2;
        });

        if (!recentWorkout) return 0;

        // Start streak calculation from the most recent workout
        checkDate = recentWorkout;
        currentStreak = 1;

        // Count consecutive workout periods (allowing 1-2 rest days)
        for (let i = 1; i < uniqueDates.length; i++) {
            const currentWorkout = uniqueDates[i];
            const daysDiff = Math.floor((checkDate.getTime() - currentWorkout.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 4) {
                // Allow up to 3 rest days between workouts
                currentStreak++;
                checkDate = currentWorkout;
            } else {
                break;
            }
        }

        return currentStreak;
    };

    const calculateLongestStreak = (workoutDates: Date[]) => {
        if (workoutDates.length === 0) return 0;
        if (workoutDates.length === 1) return 1;

        const sortedDates = workoutDates.map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime()); // Oldest first

        // Remove duplicate dates (same day workouts)
        const uniqueDates = sortedDates.filter((date, index, arr) => index === 0 || !isSameDay(date, arr[index - 1]));

        let longestStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const daysDiff = Math.floor(
                (uniqueDates[i].getTime() - uniqueDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff <= 4) {
                // Allow up to 3 rest days between workouts
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }

        return Math.max(longestStreak, currentStreak);
    };

    const calculateWeeklyAverage = (workoutDates: Date[]) => {
        if (workoutDates.length === 0) return "0.0";

        const today = new Date();
        const earliestDate = workoutDates.reduce((earliest, date) => {
            const workoutDate = new Date(date);
            return workoutDate < earliest ? workoutDate : earliest;
        }, today);

        const totalDays = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.max(totalDays / 7, 1); // At least 1 week

        const uniqueWorkoutDays = workoutDates
            .map(date => format(new Date(date), "yyyy-MM-dd"))
            .filter((date, index, arr) => arr.indexOf(date) === index).length;

        return (uniqueWorkoutDays / totalWeeks).toFixed(1);
    };

    useEffect(() => {
        if (user) {
            fetchCalorieData();
            fetchUserProfile();
            fetchAnalyticsData();
            fetchWorkoutsByDate(); // Add this line
        }
    }, [user]);

    // Calorie Stats Component
    const CalorieStats = ({ data }: { data: any }) => (
        <div>
            <h2 className={subtitleStyle}>Calorie Tracking (Last 7 Days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-900/20">
                    <h3 className="text-blue-300 font-semibold mb-2">Total Calories Burned</h3>
                    <p className="text-2xl font-bold text-white">{Math.round(data.totalCaloriesBurned)} kcal</p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-900/20">
                    <h3 className="text-blue-300 font-semibold mb-2">Daily Average</h3>
                    <p className="text-2xl font-bold text-white">{Math.round(data.averagePerDay)} kcal</p>
                </div>
            </div>

            <h3 className="text-white font-semibold mb-3">Recent Workouts</h3>
            {data.workouts.length ? (
                data.workouts.slice(0, 5).map((workout: any, index: number) => (
                    <div key={index} className="bg-slate-800/80 p-3 rounded-lg mb-2 border border-blue-900/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-white font-medium">{workout.workoutName}</p>
                                <p className="text-gray-400 text-sm">{new Date(workout.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-orange-400 font-semibold">
                                    {Math.round(workout.totalCalories)} kcal
                                </p>
                                <p className="text-gray-400 text-sm">{workout.setsCount} sets</p>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className={emptyStateStyle}>No calorie data available</p>
            )}
        </div>
    );

    // User Profile Stats Component
    const UserProfileStats = ({ profile }: { profile: any }) => {
        if (!profile || !profile.profile_complete) {
            return (
                <div>
                    <h2 className={subtitleStyle}>Fitness Profile</h2>
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-orange-500/20">
                        <p className="text-orange-400 font-medium mb-2">Profile Incomplete</p>
                        <p className="text-gray-300 text-sm">
                            Complete your fitness profile to get personalized calorie estimates and recommendations!
                        </p>
                    </div>
                </div>
            );
        }

        const bmi = profile.current_weight / (profile.height / 100) ** 2;
        const weightDifference = profile.goal_weight - profile.current_weight;
        const goalText = profile.fitness_goal?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

        if (isEditingProfile) {
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={subtitleStyle}>Edit Fitness Profile</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={saveProfileChanges}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={cancelEditingProfile}
                                className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-900/20">
                            <h3 className="text-blue-300 font-semibold mb-3">Current Stats</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-white text-sm mb-1 block">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={editableProfile.current_weight}
                                        onChange={e =>
                                            setEditableProfile({ ...editableProfile, current_weight: e.target.value })
                                        }
                                        className="w-full p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                                        placeholder="70"
                                        step="0.1"
                                        min="1"
                                        max="300"
                                    />
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-1 block">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={editableProfile.height}
                                        onChange={e =>
                                            setEditableProfile({ ...editableProfile, height: e.target.value })
                                        }
                                        className="w-full p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                                        placeholder="175"
                                        min="100"
                                        max="250"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-green-900/20">
                            <h3 className="text-green-300 font-semibold mb-3">Goals</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-white text-sm mb-1 block">Goal Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={editableProfile.goal_weight}
                                        onChange={e =>
                                            setEditableProfile({ ...editableProfile, goal_weight: e.target.value })
                                        }
                                        className="w-full p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                                        placeholder="65"
                                        step="0.1"
                                        min="1"
                                        max="300"
                                    />
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-1 block">Fitness Goal</label>
                                    <select
                                        value={editableProfile.fitness_goal}
                                        onChange={e =>
                                            setEditableProfile({ ...editableProfile, fitness_goal: e.target.value })
                                        }
                                        className="w-full p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select goal</option>
                                        <option value="lose_weight">Lose Weight</option>
                                        <option value="gain_weight">Gain Weight</option>
                                        <option value="maintain_weight">Maintain Weight</option>
                                        <option value="add_muscle">Add Muscle</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={subtitleStyle}>Fitness Profile</h2>
                    <button
                        onClick={startEditingProfile}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                        Edit
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-900/20">
                        <h3 className="text-blue-300 font-semibold mb-2">Current Stats</h3>
                        <p className="text-white">
                            Weight: <span className="font-bold">{profile.current_weight} kg</span>
                        </p>
                        <p className="text-white">
                            Height: <span className="font-bold">{profile.height} cm</span>
                        </p>
                        <p className="text-white">
                            BMI: <span className="font-bold">{bmi.toFixed(1)}</span>
                        </p>
                    </div>
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-green-900/20">
                        <h3 className="text-green-300 font-semibold mb-2">Goals</h3>
                        <p className="text-white">
                            Target: <span className="font-bold">{profile.goal_weight} kg</span>
                        </p>
                        <p className="text-white">
                            Goal: <span className="font-bold">{goalText}</span>
                        </p>
                        <p
                            className={`font-bold ${
                                weightDifference > 0
                                    ? "text-green-400"
                                    : weightDifference < 0
                                    ? "text-orange-400"
                                    : "text-blue-400"
                            }`}
                        >
                            {weightDifference > 0
                                ? `+${weightDifference.toFixed(1)} kg to gain`
                                : weightDifference < 0
                                ? `${Math.abs(weightDifference).toFixed(1)} kg to lose`
                                : "At goal weight!"}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // GitHub-style Streak Chart Component
    const StreakChart = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) {
            return (
                <div>
                    <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">Activity Streak</h3>
                    <div className="bg-slate-800/80 p-6 rounded-xl border border-blue-900/20 backdrop-blur-sm">
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-2">No workout data available yet</p>
                            <p className="text-gray-500 text-sm">
                                Start logging workouts to see your activity patterns!
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        const weeks = [];
        for (let i = 0; i < data.length; i += 7) {
            weeks.push(data.slice(i, i + 7));
        }

        const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const getIntensityColor = (value: number) => {
            if (value === 0) return "bg-slate-800 hover:bg-slate-700";
            if (value === 1) return "bg-green-900 hover:bg-green-800";
            if (value === 2) return "bg-green-700 hover:bg-green-600";
            if (value === 3) return "bg-green-500 hover:bg-green-400";
            return "bg-green-400 hover:bg-green-300";
        };

        const maxWorkouts = Math.max(...data.map(d => d.value), 1);

        return (
            <div>
                <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">Activity Streak</h3>
                <div className="bg-slate-800/80 p-6 rounded-xl border border-blue-900/20 backdrop-blur-sm">
                    <div className="flex gap-1 mb-4 overflow-x-auto">
                        <div className="flex flex-col gap-1 mr-2">
                            <div className="w-3 h-3"></div> {/* Spacer for alignment */}
                            {dayLabels.map((day, index) => (
                                <div key={index} className="w-3 h-3 flex items-center justify-center">
                                    <span className="text-xs text-gray-400 -rotate-90 text-center leading-none">
                                        {day[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className={`w-3 h-3 rounded-sm transition-colors duration-200 cursor-pointer ${getIntensityColor(
                                            Math.min(day.value, 4)
                                        )}`}
                                        title={`${day.date}: ${day.value} workout${day.value !== 1 ? "s" : ""}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Less</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-3 h-3 bg-slate-800 rounded-sm" />
                            <div className="w-3 h-3 bg-green-900 rounded-sm" />
                            <div className="w-3 h-3 bg-green-700 rounded-sm" />
                            <div className="w-3 h-3 bg-green-500 rounded-sm" />
                            <div className="w-3 h-3 bg-green-400 rounded-sm" />
                        </div>
                        <span>More</span>
                    </div>
                    {maxWorkouts > 0 && (
                        <div className="mt-3 text-center">
                            <p className="text-xs text-gray-500">
                                Peak: {maxWorkouts} workout{maxWorkouts !== 1 ? "s" : ""} in one day
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Strength Progression Chart Component
    const StrengthChart = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) {
            return (
                <div>
                    <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">Strength Progression</h3>
                    <div className="bg-slate-800/80 p-6 rounded-xl border border-blue-900/20 backdrop-blur-sm">
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-2">No strength data available yet</p>
                            <p className="text-gray-500 text-sm">
                                Start logging workouts with weights to see your strength progression!
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Get all possible exercise names from the data
        const exerciseNames = Array.from(
            new Set(data.flatMap(week => Object.keys(week).filter(key => key !== "week")))
        );

        const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

        return (
            <div>
                <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">Strength Progression</h3>
                <div className="bg-slate-800/80 p-6 rounded-xl border border-blue-900/20 backdrop-blur-sm">
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} tick={{ fill: "#9CA3AF" }} />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tick={{ fill: "#9CA3AF" }}
                                label={{
                                    value: "Weight (kg)",
                                    angle: -90,
                                    position: "insideLeft",
                                    style: { textAnchor: "middle", fill: "#9CA3AF" },
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(31, 41, 55, 0.95)",
                                    border: "1px solid #374151",
                                    borderRadius: "12px",
                                    color: "#F9FAFB",
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                                    backdropFilter: "blur(10px)",
                                }}
                                labelStyle={{ color: "#D1D5DB", fontWeight: "bold" }}
                                formatter={(value: any, name: string) => [
                                    value ? `${Math.round(value * 10) / 10} kg` : "No data",
                                    name,
                                ]}
                            />
                            {exerciseNames.map((exercise, index) => (
                                <Line
                                    key={exercise}
                                    type="monotone"
                                    dataKey={exercise}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: colors[index % colors.length] }}
                                    activeDot={{
                                        r: 6,
                                        fill: colors[index % colors.length],
                                        stroke: colors[index % colors.length],
                                        strokeWidth: 2,
                                    }}
                                    connectNulls={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    {exerciseNames.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                            {exerciseNames.map((exercise, index) => (
                                <div key={exercise} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    ></div>
                                    <span className="text-sm text-gray-300 capitalize">{exercise}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Analytics Summary Component
    const AnalyticsSummary = ({ data }: { data: any }) => (
        <div>
            <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">Fitness Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-900/80 to-blue-800/60 p-4 rounded-xl border border-blue-700/30 text-center backdrop-blur-sm">
                    <p className="text-blue-300 text-2xl font-bold font-bricolage-grotesque">{data.currentStreak}</p>
                    <p className="text-gray-300 text-sm font-medium">Current Streak</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/80 to-green-800/60 p-4 rounded-xl border border-green-700/30 text-center backdrop-blur-sm">
                    <p className="text-green-300 text-2xl font-bold font-bricolage-grotesque">{data.longestStreak}</p>
                    <p className="text-gray-300 text-sm font-medium">Longest Streak</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/80 to-yellow-800/60 p-4 rounded-xl border border-yellow-700/30 text-center backdrop-blur-sm">
                    <p className="text-yellow-300 text-2xl font-bold font-bricolage-grotesque">{data.totalWorkouts}</p>
                    <p className="text-gray-300 text-sm font-medium">Total Workouts</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/80 to-purple-800/60 p-4 rounded-xl border border-purple-700/30 text-center backdrop-blur-sm">
                    <p className="text-purple-300 text-2xl font-bold font-bricolage-grotesque">
                        {data.averageWorkoutsPerWeek}
                    </p>
                    <p className="text-gray-300 text-sm font-medium">Avg/Week</p>
                </div>
            </div>
        </div>
    );

    // Main Analytics Component
    const AnalyticsView = () => {
        const getWeeklySummary = () => {
            if (!analyticsData || !streakData.length) return null;

            const thisWeek = streakData.slice(-7);
            const workoutsThisWeek = thisWeek.filter(day => day.value > 0).length;
            const totalIntensity = thisWeek.reduce((sum, day) => sum + day.value, 0);

            return {
                workoutsThisWeek,
                avgIntensity: (totalIntensity / 7).toFixed(1),
                completion: ((workoutsThisWeek / 5) * 100).toFixed(0), // Assuming 5 workouts per week goal
            };
        };

        const weeklySummary = getWeeklySummary();

        // Loading state for analytics
        if (!analyticsData) {
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-8 rounded-xl border border-blue-900/20 text-center backdrop-blur-sm">
                        <div className="animate-pulse">
                            <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">
                                Loading Analytics...
                            </h3>
                            <p className="text-gray-400">Analyzing your workout data</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Check if user has any workout data
        const hasWorkoutData = analyticsData.totalWorkouts > 0;

        if (!hasWorkoutData) {
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-8 rounded-xl border border-blue-900/20 text-center backdrop-blur-sm">
                        <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">No Workout Data Yet</h3>
                        <p className="text-gray-400 mb-4">
                            Start logging your workouts to see detailed analytics and insights!
                        </p>
                        <p className="text-gray-500 text-sm">
                            Your analytics will show workout streaks, strength progression, and activity patterns.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <AnalyticsSummary data={analyticsData} />

                {weeklySummary && (
                    <div>
                        <h3 className="text-white font-semibold mb-3 font-bricolage-grotesque">This Week's Progress</h3>
                        <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-4 rounded-xl border border-indigo-700/30 backdrop-blur-sm">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-indigo-300 text-xl font-bold font-bricolage-grotesque">
                                        {weeklySummary.workoutsThisWeek}
                                    </p>
                                    <p className="text-gray-300 text-sm">Workouts</p>
                                </div>
                                <div>
                                    <p className="text-purple-300 text-xl font-bold font-bricolage-grotesque">
                                        {weeklySummary.avgIntensity}
                                    </p>
                                    <p className="text-gray-300 text-sm">Avg Intensity</p>
                                </div>
                                <div>
                                    <p className="text-pink-300 text-xl font-bold font-bricolage-grotesque">
                                        {weeklySummary.completion}%
                                    </p>
                                    <p className="text-gray-300 text-sm">Goal Complete</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <StreakChart data={streakData} />
                <StrengthChart data={strengthData} />
            </div>
        );
    };

    return (
        <div className={containerStyle}>
            <div className={boxStyle}>
                <div className="flex flex-row items-center justify-between gap-x-4">
                    <h1 className={titleStyle + " m-0 mb-0"}>Dashboard</h1>
                    <div className="flex flex-row items-center gap-x-3">
                        <Link
                            className="px-3 py-1 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600/90 transition shadow text-center font-medium"
                            href="/chat"
                        >
                            Chat
                        </Link>
                        <UserButton />
                    </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            activeTab === "calendar" ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                        }`}
                        onClick={() => setActiveTab("calendar")}
                    >
                        Calendar
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            activeTab === "workouts" ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                        }`}
                        onClick={() => setActiveTab("workouts")}
                    >
                        Workouts
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            activeTab === "calories" ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                        }`}
                        onClick={() => setActiveTab("calories")}
                    >
                        Calories
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            activeTab === "profile" ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                        }`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Profile
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            activeTab === "analytics" ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                        }`}
                        onClick={() => setActiveTab("analytics")}
                    >
                        Analytics
                    </button>
                </div>
                <div className={contentStyle}>
                    {activeTab === "calendar" ? (
                        <CalendarView />
                    ) : activeTab === "calories" && calorieData ? (
                        <CalorieStats data={calorieData} />
                    ) : activeTab === "profile" ? (
                        <UserProfileStats profile={userProfile} />
                    ) : activeTab === "analytics" ? (
                        <AnalyticsView />
                    ) : !selectedRoutine ? (
                        <RoutineList routines={routines} selectRoutine={selectRoutine} />
                    ) : !selectedWorkout ? (
                        <WorkoutList workouts={workouts} selectWorkout={selectWorkout} />
                    ) : (
                        <SetList sets={sets} />
                    )}
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                    {activeTab === "workouts" && selectedRoutine && (
                        <button className={buttonStyle} onClick={() => setSelectedRoutine(null)}>
                            Back to Routines
                        </button>
                    )}
                    {activeTab === "workouts" && selectedWorkout && (
                        <button className={buttonStyle} onClick={() => setSelectedWorkout(null)}>
                            Back to Workouts
                        </button>
                    )}
                </div>
            </div>
            <style jsx global>{`
                .glassmorphism {
                    background: rgba(17, 24, 39, 0.7);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
                    border-radius: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(30, 58, 138, 0.25);
                    border-radius: 8px;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #334155 #0f172a;
                }

                /* Calendar Styles */
                .react-calendar {
                    background: transparent !important;
                    border: none !important;
                    font-family: inherit;
                    width: 100%;
                    color: white;
                }

                .react-calendar-dark {
                    background: transparent !important;
                    border: none !important;
                    font-family: inherit;
                    width: 100%;
                    color: white;
                }

                .react-calendar__navigation {
                    background: rgba(30, 41, 59, 0.8) !important;
                    border-radius: 12px !important;
                    margin-bottom: 1rem !important;
                    padding: 0.5rem !important;
                    border: 1px solid rgba(51, 65, 85, 0.5) !important;
                }

                .react-calendar__navigation button {
                    color: #f1f5f9 !important;
                    background: none !important;
                    border: none !important;
                    font-weight: 600 !important;
                    font-size: 1rem !important;
                    padding: 0.5rem 1rem !important;
                    border-radius: 8px !important;
                    transition: all 0.2s ease !important;
                }

                .react-calendar__navigation button:hover {
                    background: rgba(59, 130, 246, 0.3) !important;
                    transform: scale(1.05);
                }

                .react-calendar__navigation button:disabled {
                    background: rgba(100, 116, 139, 0.2) !important;
                    color: #64748b !important;
                }

                .react-calendar__navigation__label {
                    font-size: 1.1rem !important;
                    font-weight: 700 !important;
                    color: #60a5fa !important;
                }

                .react-calendar__month-view__weekdays {
                    background: rgba(51, 65, 85, 0.6) !important;
                    border-radius: 8px !important;
                    padding: 0.75rem 0 !important;
                    margin-bottom: 0.5rem !important;
                }

                .react-calendar__month-view__weekdays__weekday {
                    color: #94a3b8 !important;
                    font-weight: 600 !important;
                    font-size: 0.875rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                }

                .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                }

                .react-calendar__tile {
                    background: rgba(30, 41, 59, 0.6) !important;
                    border: 1px solid rgba(51, 65, 85, 0.4) !important;
                    color: #e2e8f0 !important;
                    padding: 1rem 0.5rem !important;
                    position: relative !important;
                    transition: all 0.2s ease !important;
                    border-radius: 8px !important;
                    margin: 2px !important;
                    font-weight: 500 !important;
                    min-height: 3rem !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .react-calendar__tile:hover {
                    background: rgba(59, 130, 246, 0.3) !important;
                    border-color: rgba(59, 130, 246, 0.6) !important;
                    transform: scale(1.05) !important;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
                }

                .react-calendar__tile--active {
                    background: rgba(59, 130, 246, 0.7) !important;
                    border-color: #3b82f6 !important;
                    color: white !important;
                    font-weight: 700 !important;
                    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4) !important;
                }

                .react-calendar__tile--now {
                    background: rgba(168, 85, 247, 0.3) !important;
                    border-color: rgba(168, 85, 247, 0.6) !important;
                    color: #f3e8ff !important;
                    font-weight: 600 !important;
                }

                .react-calendar__tile--now:hover {
                    background: rgba(168, 85, 247, 0.5) !important;
                }

                .react-calendar__tile.has-workout {
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-color: rgba(16, 185, 129, 0.5) !important;
                    color: #d1fae5 !important;
                }

                .react-calendar__tile.has-workout:hover {
                    background: rgba(16, 185, 129, 0.4) !important;
                    border-color: rgba(16, 185, 129, 0.7) !important;
                }

                .react-calendar__tile--neighboringMonth {
                    color: #64748b !important;
                    background: rgba(30, 41, 59, 0.2) !important;
                }

                .react-calendar__tile--weekend {
                    color: #fbbf24 !important;
                }

                .workout-indicator {
                    position: absolute !important;
                    bottom: 4px !important;
                    right: 4px !important;
                    background: #10b981 !important;
                    color: white !important;
                    border-radius: 50% !important;
                    width: 20px !important;
                    height: 20px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 0.75rem !important;
                    font-weight: 700 !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                }

                .workout-count {
                    color: white !important;
                    font-size: 0.7rem !important;
                    font-weight: 700 !important;
                }

                .calendar-container {
                    padding: 0.5rem;
                    background: rgba(15, 23, 42, 0.3);
                    border-radius: 12px;
                    border: 1px solid rgba(51, 65, 85, 0.3);
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
