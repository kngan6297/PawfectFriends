export const getFeedbackMessage = (reason: string): string => {
    const messages = {
        "too-large":
            "We'll prioritize smaller pets in future recommendations.",
        "too-small":
            "We'll look for larger pets that match your preferences.",
        "not-good-with-kids":
            "We'll focus on pets known to be good with children.",
        "wrong-personality":
            "We'll adjust for pets with different energy levels.",
        "too-active": "We'll recommend calmer, more relaxed pets.",
        "too-calm":
            "We'll find more energetic pets that match your lifestyle.",
        "age-preference": "We'll adjust age preferences in future searches.",
        "breed-preference":
            "We'll consider different breeds that might be a better fit.",
        "health-concerns": "We'll prioritize pets with good health records.",
        "behavior-concerns":
            "We'll focus on well-trained pets with good behavior.",
        other: "We'll use this feedback to improve our matching algorithm.",
    };

    return (
        messages[reason as keyof typeof messages] ||
        "We'll use this feedback to improve our recommendations."
    );
}; 