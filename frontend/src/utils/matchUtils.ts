export const getMatchLevel = (score: number) => {
    if (score >= 95) return "perfect";
    if (score >= 90) return "excellent";
    if (score >= 82) return "good";
    return "low";
};

export const getMatchLevelInfo = (score: number) => {
    const level = getMatchLevel(score);

    switch (level) {
        case "perfect":
            return {
                level: "perfect",
                text: "Perfect Match!",
                icon: "🌟",
                variant: "success" as const,
                gradient: "bg-gradient-to-r from-pink-500 to-red-500",
            };
        case "excellent":
            return {
                level: "excellent",
                text: "Best Match!",
                icon: "💖",
                variant: "primary" as const,
                gradient: "bg-gradient-to-r from-yellow-400 to-orange-500",
            };
        case "good":
            return {
                level: "good",
                text: "Great Match!",
                icon: "👍",
                variant: "secondary" as const,
                gradient: "bg-gradient-to-r from-sky-400 to-blue-500",
            };
        default:
            return null;
    }
}; 