import {
    ArrowRight,
    BarChart3,
    Brain,
    Calendar,
    Dumbbell,
    MessageCircle,
    Star,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
            {/* Dynamic background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-slate-700/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-blue-400/15 rounded-full blur-2xl animate-pulse delay-700"></div>
                <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-slate-600/20 rounded-full blur-2xl animate-pulse delay-300"></div>
            </div>
            {/* Navigation */}
            <nav className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Dumbbell className="w-8 h-8 text-blue-400" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-2xl font-bold text-blue-400">Fitlog</span>
                    </div>
                    <Link
                        href="/chat"
                        className="group px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-lg font-medium flex items-center space-x-2"
                    >
                        <span>Start Chatting</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </nav>
            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-8">
                            <Star className="w-4 h-4 text-blue-400 animate-pulse" />
                            <span className="text-sm text-blue-200">AI That Gets You</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                            <span className="text-white">Your</span> <span className="text-blue-400">Personal</span>
                            <br />
                            <span className="text-white">Fitness</span> <span className="text-blue-400">Coach</span>
                        </h1>

                        <p className="text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
                            Stop wrestling with complex apps. Just tell Fitlog what you did today. Our AI understands
                            your language and tracks everything effortlessly.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <Link
                                href="/chat"
                                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-300 shadow-2xl font-semibold text-lg flex items-center justify-center space-x-3"
                            >
                                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span>Try It Now - It's Free</span>
                            </Link>
                            <div className="flex items-center space-x-4 text-gray-400 justify-center sm:justify-start">
                                <div className="flex items-center space-x-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm">10k+ users</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                    ))}
                                    <span className="text-sm ml-1">4.9/5</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                            <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            </div>
                            <img
                                src="/hero.png"
                                alt="Fitlog Chat Interface"
                                className="w-full h-auto rounded-2xl shadow-lg"
                            />
                            <div className="absolute -bottom-6 -left-6 bg-blue-600 rounded-2xl p-4 shadow-xl">
                                <div className="flex items-center space-x-2">
                                    <Trophy className="w-6 h-6 text-white" />
                                    <div>
                                        <div className="text-white font-bold">Streak: 12 days</div>
                                        <div className="text-blue-200 text-sm">Keep it up!</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Social Proof */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <p className="text-gray-400 mb-8">Trusted by fitness enthusiasts worldwide</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
                        <div className="text-2xl font-bold text-white">10,000+</div>
                        <div className="text-2xl font-bold text-white">Active Users</div>
                        <div className="text-2xl font-bold text-white">50M+</div>
                        <div className="text-2xl font-bold text-white">Workouts Logged</div>
                    </div>
                </div>
            </section>
            {/* Features with Real Benefits */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Why People <span className="text-blue-400">Love</span> Fitlog
                    </h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Real stories from real people who transformed their fitness journey
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Brain,
                            title: "Speaks Your Language",
                            description:
                                '"I ran 5K this morning" → Automatically logged with pace, calories, and progress tracking',
                            benefit: "No more tedious form filling",
                        },
                        {
                            icon: MessageCircle,
                            title: "Understands Context",
                            description: '"Had a tough leg day" → AI knows your routine and suggests recovery tips',
                            benefit: "Like having a personal trainer 24/7",
                        },
                        {
                            icon: TrendingUp,
                            title: "Shows Real Progress",
                            description:
                                "Visual insights that actually matter - strength gains, consistency streaks, PR alerts",
                            benefit: "Stay motivated with meaningful data",
                        },
                        {
                            icon: Zap,
                            title: "Lightning Fast",
                            description: "Log entire workouts in under 30 seconds using natural conversation",
                            benefit: "More time working out, less time logging",
                        },
                        {
                            icon: Calendar,
                            title: "Smart Scheduling",
                            description: "AI suggests optimal workout timing based on your patterns and recovery",
                            benefit: "Never miss the perfect workout window",
                        },
                        {
                            icon: BarChart3,
                            title: "Motivating Insights",
                            description: "Get personalized tips that actually help you improve and stay consistent",
                            benefit: "Data that drives real results",
                        },
                    ].map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/60 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                            <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                            <div className="text-sm text-blue-400 font-medium">→ {feature.benefit}</div>
                        </div>
                    ))}
                </div>
            </section>
            {/* Testimonials */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            quote: "Finally, an app that gets it. I just say 'crushed chest day' and it knows exactly what I mean.",
                            name: "Sarah M.",
                            role: "Fitness Enthusiast",
                        },
                        {
                            quote: "Went from inconsistent gym-goer to 6-month streak. The AI motivation is surprisingly effective.",
                            name: "Mike R.",
                            role: "Software Engineer",
                        },
                        {
                            quote: "Best fitness decision I've made. It's like having a coach who actually listens.",
                            name: "Jessica L.",
                            role: "Personal Trainer",
                        },
                    ].map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6"
                        >
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                            <div>
                                <div className="text-white font-medium">{testimonial.name}</div>
                                <div className="text-gray-400 text-sm">{testimonial.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {/* Final CTA */}
            <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-12 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Ready to Make Fitness <span className="text-blue-400">Effortless</span>?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Join thousands who've discovered the easiest way to track workouts and build lasting habits
                    </p>
                    <Link
                        href="/chat"
                        className="inline-flex items-center space-x-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-300 shadow-2xl font-bold text-xl group"
                    >
                        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span>Start Your Journey Now</span>
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </Link>
                    <p className="text-sm text-gray-400 mt-6">
                        Free forever • No credit card required • 2-minute setup
                    </p>
                </div>
            </section>
            {/* Footer */}{" "}
            <footer className="relative z-10 border-t border-slate-800 mt-20">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-3 mb-6 md:mb-0">
                            <Dumbbell className="w-6 h-6 text-blue-400" />
                            <span className="text-xl font-bold text-blue-400">Fitlog</span>
                        </div>
                        <p className="text-gray-400 text-sm text-center md:text-right">
                            © 2024 Fitlog. Making fitness tracking human again.
                            <br />
                            <span className="text-blue-400">Built with care for real people</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
