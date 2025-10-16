import { Pet } from "@/types/pet";

interface ScoringPreferences {
  lifestyle: string;
  experience: string;
  livingSpace: string;
  timeAvailable: string;
  hasChildren: string;
  hasOtherPets: string;
  preferredSpecies: string[];
  // New fields for enhanced scoring
  userBehavior?: {
    viewedPets: string[];
    favoritedPets: string[];
    adoptedPets: string[];

  };
  dynamicWeights?: {
    speciesWeight: number;
    sizeWeight: number;
    ageWeight: number;
    behaviorWeight: number;
  };
}

interface ScoredPet extends Pet {
  matchScore: number;
  matchFactors: string[];
  confidence: number;
  explanation: string;
}

interface ScoringAccumulator {
  score: number;
  factors: string[];
  confidence: number;
  explanations: string[];
}

// Enhanced scoring with learning capabilities
class AdaptiveScoringEngine {
  private userBehaviorPatterns: Map<string, any> = new Map();
  private successMetrics: Map<string, number> = new Map();

  // Learn from user interactions
  updateUserBehavior(userId: string, interaction: {
    type: 'view' | 'favorite' | 'adopt' | 'ignore';
    petId: string;
    pet: Pet;
    timestamp: number;
  }) {
    if (!this.userBehaviorPatterns.has(userId)) {
      this.userBehaviorPatterns.set(userId, {
        interactions: [],
        preferences: new Map(),
        successRates: new Map()
      });
    }

    const userData = this.userBehaviorPatterns.get(userId);
    userData.interactions.push(interaction);

    // Update preference weights based on interactions
    this.updatePreferenceWeights(userId, interaction);
  }

  private updatePreferenceWeights(userId: string, interaction: any) {
    const userData = this.userBehaviorPatterns.get(userId);
    const pet = interaction.pet;
    const weight = this.getInteractionWeight(interaction.type);

    // Update species preference
    const currentSpeciesWeight = userData.preferences.get(`species_${pet.type}`) || 0;
    userData.preferences.set(`species_${pet.type}`, currentSpeciesWeight + weight);

    // Update size preference
    const currentSizeWeight = userData.preferences.get(`size_${pet.size}`) || 0;
    userData.preferences.set(`size_${pet.size}`, currentSizeWeight + weight);

    // Update age preference
    const currentAgeWeight = userData.preferences.get(`age_${pet.age}`) || 0;
    userData.preferences.set(`age_${pet.age}`, currentAgeWeight + weight);
  }

  private getInteractionWeight(type: string): number {
    const weights = {
      'adopt': 1.0,
      'favorite': 0.7,

      'view': 0.2,
      'ignore': -0.3
    };
    return weights[type] || 0;
  }

  // Get learned preferences for a user
  getLearnedPreferences(userId: string): any {
    const userData = this.userBehaviorPatterns.get(userId);
    if (!userData) return {};

    const preferences = {};
    for (const [key, weight] of userData.preferences) {
      const [category, value] = key.split('_');
      if (!preferences[category]) preferences[category] = {};
      preferences[category][value] = weight;
    }

    return preferences;
  }

  // Calculate dynamic weights based on user behavior
  calculateDynamicWeights(userId: string, preferences: ScoringPreferences): any {
    const learnedPrefs = this.getLearnedPreferences(userId);

    // Base weights
    let weights = {
      speciesWeight: 0.4,
      sizeWeight: 0.25,
      ageWeight: 0.2,
      behaviorWeight: 0.15
    };

    // Adjust based on learned preferences
    if (learnedPrefs.species) {
      const maxSpeciesWeight = Math.max(...Object.values(learnedPrefs.species));
      if (maxSpeciesWeight > 2) {
        weights.speciesWeight = Math.min(0.6, weights.speciesWeight + 0.1);
      }
    }

    if (learnedPrefs.size) {
      const maxSizeWeight = Math.max(...Object.values(learnedPrefs.size));
      if (maxSizeWeight > 1.5) {
        weights.sizeWeight = Math.min(0.4, weights.sizeWeight + 0.05);
      }
    }

    return weights;
  }
}

// Global instance of the adaptive scoring engine
const adaptiveEngine = new AdaptiveScoringEngine();

function applyScore(
  condition: boolean,
  score: number,
  message: string,
  pet: Pet,
  prefs: ScoringPreferences,
  accumulator: ScoringAccumulator,
  confidence: number = 1.0
) {
  if (condition) {
    accumulator.score += score;
    accumulator.factors.push(message);
    accumulator.confidence = Math.min(accumulator.confidence + confidence * 0.1, 1.0);
    accumulator.explanations.push(message);
    console.log(`Added ${message} score for`, pet.name);
  }
}

// Enhanced scoring rules with confidence levels
const ENHANCED_SCORING_RULES = [
  // Species preference (highest priority)
  {
    name: "Preferred Species",
    condition: (pet: Pet, prefs: ScoringPreferences) => prefs.preferredSpecies.includes(pet.type),
    score: 0.4,
    factor: "Matches your preferred species",
    confidence: 0.9,
  },

  // Living space compatibility
  {
    name: "Apartment-friendly",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.livingSpace.includes("apartment") && pet.size === "small",
    score: 0.25,
    factor: "Good for apartment living",
    confidence: 0.8,
  },
  {
    name: "Yard-friendly",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.livingSpace.includes("yard") && pet.size === "large",
    score: 0.25,
    factor: "Great for homes with yards",
    confidence: 0.8,
  },
  {
    name: "House-friendly",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.livingSpace.includes("house") && pet.size === "medium",
    score: 0.2,
    factor: "Perfect for house living",
    confidence: 0.7,
  },

  // Experience level compatibility
  {
    name: "First-time Owner Friendly",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.experience === "first-time" && pet.age === "adult",
    score: 0.2,
    factor: "Good for first-time owners",
    confidence: 0.85,
  },
  {
    name: "Experienced Owner Match",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.experience === "experienced" && pet.age === "young",
    score: 0.2,
    factor: "Perfect for experienced owners",
    confidence: 0.85,
  },

  // Time availability compatibility
  {
    name: "Low Maintenance",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.timeAvailable === "minimal" && pet.type === "cat",
    score: 0.15,
    factor: "Low maintenance",
    confidence: 0.75,
  },
  {
    name: "Active Lifestyle",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.timeAvailable === "significant" && pet.type === "dog",
    score: 0.15,
    factor: "Needs active lifestyle",
    confidence: 0.75,
  },

  // Children compatibility
  {
    name: "Good with Children",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.hasChildren === "yes" && pet.behavior?.goodWithChildren,
    score: 0.15,
    factor: "Good with children",
    confidence: 0.9,
  },

  // Other pets compatibility
  {
    name: "Good with Other Pets",
    condition: (pet: Pet, prefs: ScoringPreferences) =>
      prefs.hasOtherPets === "yes" &&
      pet.behavior?.goodWithDogs &&
      pet.behavior?.goodWithCats,
    score: 0.15,
    factor: "Good with other pets",
    confidence: 0.85,
  },
];

export const scorePet = (
  pet: Pet,
  preferences: ScoringPreferences,
  options: {
    includeRandomBonus?: boolean;
    randomSeed?: number;
    userId?: string;
    useLearning?: boolean;
  } = {}
): ScoredPet => {
  const {
    includeRandomBonus = true,
    randomSeed,
    userId,
    useLearning = true
  } = options;

  const accumulator: ScoringAccumulator = {
    score: 0,
    factors: [],
    confidence: 0.5, // Base confidence
    explanations: [],
  };

  console.log(
    "Scoring pet:",
    pet.name,
    "Type:",
    pet.type,
    "Size:",
    pet.size,
    "Age:",
    pet.age
  );

  // Get dynamic weights if learning is enabled
  let dynamicWeights = preferences.dynamicWeights;
  if (useLearning && userId) {
    dynamicWeights = adaptiveEngine.calculateDynamicWeights(userId, preferences);
  }

  // Apply enhanced scoring rules
  ENHANCED_SCORING_RULES.forEach((rule) => {
    const adjustedScore = dynamicWeights ?
      rule.score * (dynamicWeights[`${rule.name.toLowerCase().replace(/\s+/g, '')}Weight`] || 1) :
      rule.score;

    applyScore(
      rule.condition(pet, preferences),
      adjustedScore,
      rule.factor,
      pet,
      preferences,
      accumulator,
      rule.confidence
    );
  });

  // Apply learned preferences if available
  if (useLearning && userId) {
    const learnedPrefs = adaptiveEngine.getLearnedPreferences(userId);

    // Apply learned species preference
    if (learnedPrefs.species && learnedPrefs.species[pet.type]) {
      const learnedScore = Math.min(learnedPrefs.species[pet.type] * 0.1, 0.3);
      accumulator.score += learnedScore;
      accumulator.factors.push(`Based on your past interactions with ${pet.type}s`);
      accumulator.confidence = Math.min(accumulator.confidence + 0.1, 1.0);
    }

    // Apply learned size preference
    if (learnedPrefs.size && learnedPrefs.size[pet.size]) {
      const learnedScore = Math.min(learnedPrefs.size[pet.size] * 0.05, 0.2);
      accumulator.score += learnedScore;
      accumulator.factors.push(`Based on your preference for ${pet.size} pets`);
      accumulator.confidence = Math.min(accumulator.confidence + 0.05, 1.0);
    }
  }

  // Add controlled randomization if enabled
  if (includeRandomBonus) {
    let randomBonus: number;

    if (randomSeed !== undefined) {
      // Use seeded random for reproducibility
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      randomBonus = seededRandom(randomSeed + pet._id?.charCodeAt(0) || 0) * 0.1;
    } else {
      // Use regular random
      randomBonus = Math.random() * 0.1;
    }

    accumulator.score += randomBonus;
    console.log(`Added random bonus of ${randomBonus.toFixed(3)} for`, pet.name);
  }

  // Generate explanation
  const explanation = generateExplanation(accumulator.factors, pet, accumulator.confidence);

  console.log(
    "Final score for",
    pet.name,
    ":",
    accumulator.score.toFixed(3),
    "Confidence:",
    accumulator.confidence.toFixed(3),
    "Factors:",
    accumulator.factors
  );

  return {
    ...pet,
    matchScore: Math.min(accumulator.score, 1.0),
    matchFactors: accumulator.factors,
    confidence: accumulator.confidence,
    explanation,
  };
};

function generateExplanation(factors: string[], pet: Pet, confidence: number): string {
  if (factors.length === 0) {
    return `We don't have enough information to provide a strong recommendation for ${pet.name}.`;
  }

  const topFactors = factors.slice(0, 3);
  const confidenceLevel = confidence > 0.8 ? "high" : confidence > 0.6 ? "medium" : "low";

  return `${pet.name} is a ${confidenceLevel} confidence match because: ${topFactors.join(', ')}.`;
}

// Function to update user behavior for learning
export const updateUserBehavior = (
  userId: string,
  interaction: {
    type: 'view' | 'favorite' | 'adopt' | 'chat' | 'ignore';
    petId: string;
    pet: Pet;
    timestamp: number;
  }
) => {
  adaptiveEngine.updateUserBehavior(userId, interaction);
};

export const getTopRecommendations = (
  pets: Pet[],
  preferences: ScoringPreferences,
  limit: number = 6,
  options: {
    includeRandomBonus?: boolean;
    randomSeed?: number;
    userId?: string;
    useLearning?: boolean;
  } = {}
): ScoredPet[] => {
  const scoredPets = pets.map((pet) => scorePet(pet, preferences, options));

  return scoredPets
    .sort((a, b) => {
      // Sort by score first, then by confidence for tie-breaks
      const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
      if (Math.abs(scoreDiff) < 0.01) {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      return scoreDiff;
    })
    .slice(0, limit);
}; 