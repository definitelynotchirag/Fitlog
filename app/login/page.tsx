"use client";
import { SignIn } from "@clerk/nextjs";

const Login = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="flex flex-col items-center w-full">
                <SignIn
                    appearance={{
                        elements: {
                            card: "bg-transparent shadow-none border-none",
                            formButtonPrimary:
                                "bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg transition-all",
                            headerTitle: "text-white text-xl font-semibold",
                            headerSubtitle: "text-slate-300 text-sm",
                            socialButtonsBlockButton: "bg-slate-800 text-white hover:bg-slate-700",
                            dividerText: "text-slate-400",
                            formFieldInput: "bg-slate-800 text-white border-slate-600 focus:border-indigo-500",
                            formFieldLabel: "text-slate-300",
                            footerActionText: "text-slate-300",
                            footerActionLink: "text-indigo-300 hover:text-indigo-400 underline",
                        },
                        variables: {
                            colorPrimary: "#6366f1",
                            colorBackground: "transparent",
                            colorText: "#fff",
                            fontFamily: "Jost, sans-serif",
                            
                        },
                    }}
                    routing="hash"
                    signUpUrl="/signup"
                />
                <div className="text-center text-slate-400 mt-6">
                    <span className="font-semibold text-slate-300">Demo credentials:</span> <br />
                    <span className="text-slate-200">Email:</span> <span className="select-all">demo+clerk_test@example.com</span>
                    <br />
                    <span className="text-slate-200">Password:</span> <span className="select-all">notatestaccount</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
