"use client";

import { SignUp } from "@clerk/nextjs";

const Signup = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <SignUp
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
                signInUrl="/login"
            />
        </div>
    );
};

export default Signup;
