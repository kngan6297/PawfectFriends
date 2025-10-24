from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
import uvicorn
import logging
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity  # for optional text similarity
from dateutil import parser as dtparser  # tolerant ISO timestamp parsing
import json

from services.pet_matching import PetMatchingService

# Configure logging
logging.basicConfig(level=logging.WARNING)  # Reduced verbosity
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PawfectFriends AI Service",
    description="ML-based pet recommendation service",
    version="1.0.0"
)

# Add CORS middleware
ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "https://pawfectfriends.xyz",
    "https://www.pawfectfriends.xyz",  # Add www subdomain
    "https://pawfectfriends-frontend.onrender.com",
    "https://your-frontend.app",
    "https://pawfectfriends.netlify.app",  # Add Netlify deployment
    "https://pawfectfriends.vercel.app",   # Add Vercel deployment
    "*"  # Allow all origins for health checks (temporary fix)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # enable cookies/auth
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the pet matching service
pet_matching_service = PetMatchingService()

# Pydantic models for API requests/responses
class PhotoData(BaseModel):
    _id: Optional[str] = None
    url: Optional[str] = None
    small: Optional[str] = None
    medium: Optional[str] = None
    large: Optional[str] = None
    full: Optional[str] = None
    caption: Optional[str] = None
    id: Optional[str] = None

class PetData(BaseModel):
    id: str
    name: str
    species: str
    breed: str
    age: str
    size: str
    description: Optional[str] = None
    photos: List[PhotoData] = Field(default_factory=list)
    health_records: List[Dict] = Field(default_factory=list)
    behavior_records: List[Dict] = Field(default_factory=list)
    created_at: Optional[str] = None
    view_count: int = 0
    favorite_count: int = 0
    chat_count: int = 0
    
    class Config:
        extra = "allow"  # Allow extra fields to be more flexible

class UserData(BaseModel):
    id: str
    preferences: Dict = Field(default_factory=dict)
    interactionHistory: List[Dict] = Field(default_factory=list)
    favoritePets: List[str] = Field(default_factory=list)
    adoptionHistory: List[str] = Field(default_factory=list)
    
    class Config:
        extra = "allow"  # Allow extra fields to be more flexible

class MLRecommendationRequest(BaseModel):
    user: UserData
    pets: List[PetData]
    preferences: Dict = Field(default_factory=dict)
    limit: Optional[int] = 10

class MLRecommendationResponse(BaseModel):
    recommendations: List[Dict]
    total_pets: int
    ml_enabled: bool
    version: str

class InteractionRecord(BaseModel):
    user_id: str
    pet_id: str
    interaction_type: str  # 'view', 'favorite', 'chat', 'adopt', 'ignore'
    pet_data: PetData
    user_data: UserData
    timestamp: Optional[str] = None

class SimilarPetsRequest(BaseModel):
    pet_id: str
    pets: List[PetData]
    limit: Optional[int] = 5
    use_faiss: Optional[bool] = True

class SimilarPetsResponse(BaseModel):
    similar_pets: List[Dict[str, Any]]
    search_method: str
    query_pet_id: str

class CollaborativeRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    user_id: str
    total_recommendations: int

class AdvancedMatchRequest(BaseModel):
    preferences: Dict[str, Any]
    pet: PetData
    use_advanced: Optional[bool] = True

class AdvancedMatchResponse(BaseModel):
    match_score: float
    cosine_similarity: float
    rule_based_score: float
    text_similarity: Optional[float] = None
    weighted_score: float
    method_used: str

class CollaborativeRecommendationRequest(BaseModel):
    user_id: str
    users: List[UserData]
    pets: List[PetData]
    limit: Optional[int] = 10

# NEW: Score pets request/response models
class ScorePetsRequest(BaseModel):
    preferences: Dict[str, Any]
    pets: List[PetData]
    user_id: Optional[str] = None
    use_learning: Optional[bool] = True
    use_ml: Optional[bool] = True
    ml_weight: Optional[float] = 0.7
    rule_weight: Optional[float] = 0.3

class ScoredPet(BaseModel):
    pet: PetData
    score: float
    ml_score: Optional[float] = None
    rule_score: Optional[float] = None
    learned_bonus: Optional[float] = None
    factors: List[str] = Field(default_factory=list)
    explanation: str = ""
    confidence: float = 0.5

class ScorePetsResponse(BaseModel):
    scored_pets: List[ScoredPet]
    total_pets: int
    ml_enabled: bool
    rule_enabled: bool
    hybrid_enabled: bool

# NEW: API schemas for the /recommend endpoint
class PreferencesModel(BaseModel):
    lifestyle: Optional[Union[str, List[str]]] = None
    experience: Optional[Union[str, List[str]]] = None
    livingSpace: Optional[Union[str, List[str]]] = None
    timeAvailable: Optional[Union[str, List[str]]] = None
    hasChildren: Optional[Union[str, List[str]]] = None
    hasOtherPets: Optional[Union[str, List[str]]] = None
    preferredSpecies: List[str] = Field(default_factory=list)
    preferredTypes: List[str] = Field(default_factory=list)
    preferredSizes: List[str] = Field(default_factory=list)
    preferredAges: List[str] = Field(default_factory=list)
    preferredBreeds: List[str] = Field(default_factory=list)
    maxDistance: Optional[int] = None
    activityLevel: Optional[Union[str, List[str]]] = None
    budget: Optional[Union[str, List[str]]] = None
    hasYard: Optional[Union[str, List[str]]] = None
    additionalInfo: Optional[str] = None

class PetModel(BaseModel):
    id: str
    name: str
    type: str  # species
    breed: str
    age: str
    size: str
    description: Optional[str] = None
    photos: List[str] = Field(default_factory=list)
    health_records: List[Dict] = Field(default_factory=list)
    behavior_records: List[Dict] = Field(default_factory=list)
    created_at: Optional[str] = None
    view_count: int = 0
    favorite_count: int = 0
    chat_count: int = 0
    adoptionFee: Optional[float] = None
    status: Optional[str] = "adoptable"

class MatchScore(BaseModel):
    petId: str
    score: float
    reasons: List[str]

class RecommendResponse(BaseModel):
    matches: List[MatchScore]

# NEW: Feedback models for recommendation learning
class RecommendationFeedback(BaseModel):
    user_id: str
    pet_id: str
    feedback_type: str  # 'positive', 'negative', 'neutral'
    reason: str
    details: Optional[str] = None
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    pet_attributes: Dict[str, Any] = Field(default_factory=dict)
    recommendation_score: Optional[float] = None
    session_id: Optional[str] = None
    timestamp: Optional[str] = None

class FeedbackResponse(BaseModel):
    status: str
    message: str
    learning_impact: Dict[str, Any]



class FeatureImportanceResponse(BaseModel):
    feature_importance: Dict[str, float]
    total_feedback_count: int
    last_training: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "PawfectFriends AI Service",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": [
            "/api/recommendations/ml",
            "/api/recommendations/score",
            "/recommend",  # NEW endpoint
            "/api/recommendations/similar",
            "/api/recommendations/collaborative",
            "/api/interactions/record",
            "/api/model/train",
            "/api/model/status",
            "/api/validate-request"  # NEW validation endpoint
        ]
    }

@app.get("/health")
async def health_check():
    """Simple health check endpoint for Railway"""
    try:
        # Check if the pet matching service is initialized
        service_status = "OK" if pet_matching_service else "ERROR"
        
        return {
            "status": "OK",
            "service_status": service_status,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "environment": "production",
            "cors_enabled": True
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "ERROR",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "environment": "production"
        }

@app.get("/ping")
async def ping():
    """Simple ping endpoint for health checks without CORS issues"""
    return {"pong": True, "timestamp": datetime.now().isoformat()}

@app.post("/api/validate-request")
async def validate_request(request: Dict[str, Any]):
    """
    Validate request format for debugging
    """
    try:
        logger.info(f"Validating request: {request}")
        
        # Try to parse as MLRecommendationRequest
        try:
            ml_request = MLRecommendationRequest(**request)
            return {
                "valid": True,
                "message": "Request is valid for ML recommendations",
                "parsed_request": ml_request.dict()
            }
        except Exception as e:
            logger.error(f"ML request validation failed: {e}")
            
        # Try to parse as ScorePetsRequest
        try:
            score_request = ScorePetsRequest(**request)
            return {
                "valid": True,
                "message": "Request is valid for score pets",
                "parsed_request": score_request.dict()
            }
        except Exception as e:
            logger.error(f"Score request validation failed: {e}")
            
        return {
            "valid": False,
            "message": "Request does not match any known format",
            "error_details": str(e) if 'e' in locals() else "Unknown error"
        }
        
    except Exception as e:
        logger.error(f"Error validating request: {e}")
        return {
            "valid": False,
            "message": f"Validation error: {str(e)}"
        }

@app.post("/recommend", response_model=RecommendResponse)
async def recommend_pets(preferences: PreferencesModel, pets: List[PetModel]):
    """
    FastAPI endpoint for pet recommendations
    This is the main endpoint that matches the specified API structure
    """
    try:
        logger.info(f"Recommending pets for preferences: {preferences}")
        logger.info(f"Processing {len(pets)} pets")
        
        scores = []
        
        for pet in pets:
            # Convert PetModel to the format expected by the matching service
            pet_data = {
                'id': pet.id,
                'name': pet.name,
                'species': pet.type,
                'breed': pet.breed,
                'age': pet.age,
                'size': pet.size,
                'description': pet.description,
                'photos': pet.photos or [],
                'health_records': pet.health_records or [],
                'behavior_records': pet.behavior_records or [],
                'created_at': pet.created_at,
                'view_count': pet.view_count or 0,
                'favorite_count': pet.favorite_count or 0,
                'chat_count': pet.chat_count or 0
            }
            
            # Convert preferences to dict format and clean them
            preferences_dict = preferences.dict(exclude_none=True)
            
            # Convert Union[str, List[str]] fields to strings
            cleaned_preferences = {}
            for key, value in preferences_dict.items():
                if isinstance(value, list) and key not in ['preferredSpecies', 'preferredTypes', 'preferredSizes', 'preferredAges', 'preferredBreeds']:
                    # For single-select fields, take the first value if it's a list
                    cleaned_preferences[key] = value[0] if value else None
                else:
                    # For multi-select fields or other types, keep as is
                    cleaned_preferences[key] = value if value not in ("", None, []) else None
            
            logger.info(f"Cleaned preferences: {cleaned_preferences}")
            
            # Compute match score using AI logic
            score = pet_matching_service.compute_match_score(cleaned_preferences, pet_data)
            
            # Get reasons for the match
            reasons = pet_matching_service.explain_match(cleaned_preferences, pet_data)
            
            scores.append(MatchScore(
                petId=pet.id,
                score=round(score, 4),
                reasons=reasons
            ))
        
        # Sort by score (highest first)
        scores.sort(key=lambda x: x.score, reverse=True)
        
        logger.info(f"Generated {len(scores)} recommendations")
        
        return RecommendResponse(matches=scores)
        
    except Exception as e:
        logger.error(f"Error in recommend_pets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/score", response_model=ScorePetsResponse)
async def score_pets(request: ScorePetsRequest):
    """
    Score pets based on preferences and return scored pets
    This is the main endpoint for the new goal - instead of mapping locally,
    send all preferences and pets to AI service for scoring
    """
    try:
        logger.info(f"Scoring {len(request.pets)} pets for user {request.user_id}")
        
        # Convert to dictionaries for the service
        pets_data = [pet.dict() for pet in request.pets]
        preferences = request.preferences or {}
        
        scored_pets = []
        
        for pet_data in pets_data:
            # Create user data for scoring
            user_data = {
                'id': request.user_id or 'anonymous',
                'preferences': preferences,
                'interactionHistory': [],
                'favoritePets': [],
                'adoptionHistory': []
            }
            
            # Get ML score if enabled
            ml_score = 0.0
            if request.use_ml:
                try:
                    ml_score = pet_matching_service.predict_match_score(user_data, pet_data)
                except Exception as e:
                    logger.warning(f"ML scoring failed for pet {pet_data['id']}: {e}")
                    ml_score = 0.0
            
            # Get rule-based score
            rule_score = pet_matching_service._calculate_rule_based_score(pet_data, preferences)
            
            # Get learned bonus if user_id provided and learning enabled
            learned_bonus = 0.0
            if request.user_id and request.use_learning:
                try:
                    learned_bonus = pet_matching_service._get_learned_preference_bonus(request.user_id, pet_data)
                except Exception as e:
                    logger.warning(f"Learned bonus calculation failed: {e}")
                    learned_bonus = 0.0
            
            # Calculate combined score
            if request.use_ml and request.use_learning:
                # Hybrid approach
                combined_score = (ml_score * request.ml_weight) + (rule_score * request.rule_weight) + learned_bonus
            elif request.use_ml:
                # ML + rule-based
                combined_score = (ml_score * request.ml_weight) + (rule_score * request.rule_weight)
            else:
                # Rule-based only
                combined_score = rule_score + learned_bonus
            
            # Ensure score is between 0 and 1
            final_score = max(0.0, min(1.0, combined_score))
            
            # Generate factors and explanation
            factors = []
            if ml_score > 0.6:
                factors.append("AI model recommends this pet")
            if rule_score > 0.6:
                factors.append("Matches your stated preferences")
            if learned_bonus > 0.1:
                factors.append("Based on your past interactions")
            
            explanation = f"{pet_data['name']}: "
            if factors:
                explanation += "; ".join(factors)
            else:
                explanation += "This pet might be a good match"
            explanation += "."
            
            # Calculate confidence
            confidence = 0.5  # Base confidence
            if ml_score > 0.7:
                confidence += 0.2
            if rule_score > 0.7:
                confidence += 0.2
            if learned_bonus > 0.1:
                confidence += 0.1
            confidence = 0.0 if confidence != confidence else confidence  # NaN guard
            confidence = max(0.0, min(1.0, confidence))
            
            scored_pet = ScoredPet(
                pet=PetData(**pet_data),
                score=final_score,
                ml_score=ml_score if request.use_ml else None,
                rule_score=rule_score,
                learned_bonus=learned_bonus if request.use_learning else None,
                factors=factors,
                explanation=explanation,
                confidence=confidence
            )
            
            scored_pets.append(scored_pet)
        
        # Sort by score (highest first)
        scored_pets.sort(key=lambda x: x.score, reverse=True)
        
        return ScorePetsResponse(
            scored_pets=scored_pets,
            total_pets=len(scored_pets),
            ml_enabled=request.use_ml,
            rule_enabled=True,
            hybrid_enabled=request.use_ml and request.use_learning
        )
        
    except Exception as e:
        logger.error(f"Error scoring pets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/ml", response_model=MLRecommendationResponse)
async def get_ml_recommendations(request: MLRecommendationRequest):
    """
    Get ML-based pet recommendations
    """
    try:
        logger.info(f"Getting ML recommendations for user {request.user.id} with {len(request.pets)} pets")
        
        # Convert to dictionaries for the service
        user_data = request.user.dict()
        pets_data = [pet.dict() for pet in request.pets]
        preferences = request.preferences or {}
        
        # Get ML recommendations
        recommendations = pet_matching_service.get_ml_recommendations(
            user_data=user_data,
            pets=pets_data,
            preferences=preferences,
            limit=request.limit
        )
        
        logger.info(f"Generated {len(recommendations)} recommendations for user {request.user.id}")
        
        # Train model in background if we have enough data
        if len(pet_matching_service.interaction_history) >= 10:
            # Note: In production, you'd want to use a proper task queue
            pet_matching_service.train_model()
        
        return MLRecommendationResponse(
            recommendations=recommendations,
            total_pets=len(pets_data),
            ml_enabled=True,
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error(f"Error getting ML recommendations: {e}")
        logger.error(f"Request data: {request.dict() if hasattr(request, 'dict') else 'Could not serialize request'}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/similar", response_model=SimilarPetsResponse)
async def get_similar_pets(request: SimilarPetsRequest):
    """
    Get similar pets using content-based filtering
    """
    try:
        logger.info(f"Getting similar pets for pet {request.pet_id}")
        
        pets_data = [pet.dict() for pet in request.pets]
        
        similar_pets = pet_matching_service.get_similar_pets(
            pet_id=request.pet_id,
            pets=pets_data,
            limit=request.limit
        )
        
        return SimilarPetsResponse(
            similar_pets=similar_pets,
            search_method="content_based",
            query_pet_id=request.pet_id
        )
        
    except Exception as e:
        logger.error(f"Error getting similar pets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/collaborative", response_model=CollaborativeRecommendationResponse)
async def get_collaborative_recommendations(request: CollaborativeRecommendationRequest):
    """
    Get collaborative filtering recommendations
    """
    try:
        logger.info(f"Getting collaborative recommendations for user {request.user_id}")
        
        users_data = [user.dict() for user in request.users]
        pets_data = [pet.dict() for pet in request.pets]
        
        collaborative_recs = pet_matching_service.get_collaborative_recommendations(
            user_id=request.user_id,
            users=users_data,
            pets=pets_data
        )
        
        return CollaborativeRecommendationResponse(
            recommendations=collaborative_recs,
            user_id=request.user_id,
            total_recommendations=len(collaborative_recs)
        )
        
    except Exception as e:
        logger.error(f"Error getting collaborative recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interactions/record")
async def record_interaction(request: InteractionRecord):
    """
    Record user interaction for ML learning
    """
    try:
        logger.info(f"Recording {request.interaction_type} interaction for user {request.user_id}")
        
        # Record the interaction
        pet_matching_service.record_user_interaction(
            user_id=request.user_id,
            pet_id=request.pet_id,
            interaction_type=request.interaction_type,
            pet_data=request.pet_data.dict(),
            user_data=request.user_data.dict(),
            timestamp=dtparser.isoparse(request.timestamp) if request.timestamp else None
        )
        
        return {
            "status": "success",
            "message": f"Recorded {request.interaction_type} interaction",
            "user_id": request.user_id,
            "pet_id": request.pet_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error recording interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/recommendation", response_model=FeedbackResponse)
async def record_recommendation_feedback(request: RecommendationFeedback):
    """
    Record feedback on recommendations for ML learning
    """
    try:
        logger.info(f"Recording {request.feedback_type} feedback for user {request.user_id}")
        
        # Record the feedback for learning
        learning_impact = pet_matching_service.record_recommendation_feedback(
            user_id=request.user_id,
            pet_id=request.pet_id,
            feedback_type=request.feedback_type,
            reason=request.reason,
            details=request.details,
            user_preferences=request.user_preferences,
            pet_attributes=request.pet_attributes,
            recommendation_score=request.recommendation_score,
            session_id=request.session_id,
            timestamp=dtparser.isoparse(request.timestamp) if request.timestamp else None
        )
        
        return FeedbackResponse(
            status="success",
            message=f"Recorded {request.feedback_type} feedback",
            learning_impact=learning_impact
        )
        
    except Exception as e:
        logger.error(f"Error recording recommendation feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/model/train")
async def train_model(background_tasks: BackgroundTasks):
    """
    Train the recommendation model
    """
    try:
        logger.info("Starting model training")
        
        # Train model in background
        def train():
            try:
                pet_matching_service.train_model()
                logger.info("Model training completed successfully")
            except Exception as e:
                logger.error(f"Error during model training: {e}")
        
        background_tasks.add_task(train)
        
        return {
            "status": "training_started",
            "message": "Model training started in background",
            "interaction_count": len(pet_matching_service.interaction_history)
        }
        
    except Exception as e:
        logger.error(f"Error starting model training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/status")
async def get_model_status():
    """
    Get model status and statistics
    """
    try:
        interaction_count = len(pet_matching_service.interaction_history)
        user_count = len(pet_matching_service.user_profiles)
        
        # Get model info
        model_info = {
            "model_loaded": pet_matching_service.recommendation_model is not None,
            "interaction_count": interaction_count,
            "user_count": user_count,
            "can_train": interaction_count >= 10,
            "last_training": "N/A"  # Could be enhanced to track training timestamps
        }
        
        return model_info
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/preferences")
async def get_user_preferences(user_id: str):
    """
    Get learned preferences for a user
    """
    try:
        learned_prefs = pet_matching_service.getLearnedPreferences(user_id)
        
        return {
            "user_id": user_id,
            "learned_preferences": learned_prefs,
            "has_data": len(learned_prefs) > 0
        }
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/clusters")
async def get_user_clusters():
    """
    Get user clusters for collaborative filtering
    """
    try:
        # This would need to be enhanced to get actual user data
        # For now, return empty clusters
        return {
            "clusters": {},
            "message": "User clustering requires user data to be provided"
        }
        
    except Exception as e:
        logger.error(f"Error getting user clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/hybrid")
async def get_hybrid_recommendations(request: MLRecommendationRequest):
    """
    Get hybrid recommendations combining rule-based and ML approaches
    """
    try:
        logger.info(f"Getting hybrid recommendations for user {request.user.id}")
        
        user_data = request.user.dict()
        pets_data = [pet.dict() for pet in request.pets]
        preferences = request.preferences or {}
        
        # Get ML recommendations
        ml_recommendations = pet_matching_service.get_ml_recommendations(
            user_data=user_data,
            pets=pets_data,
            preferences=preferences,
            limit=request.limit
        )
        
        # Get rule-based recommendations (simplified)
        rule_based_recs = []
        for pet in pets_data:
            rule_score = pet_matching_service._calculate_rule_based_score(pet, preferences)
            rule_based_recs.append({
                'pet': pet,
                'score': rule_score,
                'type': 'rule_based'
            })
        
        # Combine recommendations
        combined_recs = []
        for ml_rec in ml_recommendations:
            pet_id = ml_rec['pet']['id']
            rule_rec = next((r for r in rule_based_recs if r['pet']['id'] == pet_id), None)
            
            if rule_rec:
                # Weighted combination
                combined_score = 0.7 * ml_rec['score'] + 0.3 * rule_rec['score']
                combined_recs.append({
                    'pet': ml_rec['pet'],
                    'score': combined_score,
                    'ml_score': ml_rec['score'],
                    'rule_score': rule_rec['score'],
                    'explanation': ml_rec['explanation']
                })
            else:
                combined_recs.append(ml_rec)
        
        # Sort by combined score
        combined_recs.sort(key=lambda x: x['score'], reverse=True)
        
        return {
            "recommendations": combined_recs[:request.limit],
            "total_pets": len(pets_data),
            "hybrid_enabled": True,
            "ml_weight": 0.7,
            "rule_weight": 0.3
        }
        
    except Exception as e:
        logger.error(f"Error getting hybrid recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/features/importance", response_model=FeatureImportanceResponse)
async def get_feature_importance():
    """
    Get current feature importance weights
    """
    try:
        importance = pet_matching_service.get_feature_importance()
        feedback_count = len(getattr(pet_matching_service, 'feedback_history', []))
        
        return FeatureImportanceResponse(
            feature_importance=importance,
            total_feedback_count=feedback_count,
            last_training=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error getting feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/features/importance/train")
async def train_feature_importance():
    """
    Train feature importance model based on feedback data
    """
    try:
        pet_matching_service.train_feature_importance_model()
        
        return {
            "status": "success",
            "message": "Feature importance model trained successfully",
            "feature_importance": pet_matching_service.get_feature_importance(),
            "feedback_count": len(getattr(pet_matching_service, 'feedback_history', []))
        }
        
    except Exception as e:
        logger.error(f"Error training feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/features/importance")
async def update_feature_importance(importance_weights: Dict[str, float]):
    """
    Update feature importance weights manually
    """
    try:
        pet_matching_service.set_feature_importance(importance_weights)
        
        return {
            "status": "success",
            "message": "Feature importance weights updated",
            "feature_importance": pet_matching_service.get_feature_importance()
        }
        
    except Exception as e:
        logger.error(f"Error updating feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/similarity/build-index")
async def build_similarity_index(pets: List[PetData]):
    """
    Build FAISS index for fast similarity search
    """
    try:
        # Convert PetData to dict format
        pets_dict = [pet.dict() for pet in pets]
        
        # Build FAISS index
        pet_matching_service.build_faiss_index(pets_dict)
        
        return {
            "status": "success",
            "message": f"Built similarity index with {len(pets)} pets",
            "faiss_available": pet_matching_service.faiss_index is not None,
            "sentence_transformers_available": pet_matching_service.sentence_model is not None
        }
        
    except Exception as e:
        logger.error(f"Error building similarity index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/similarity/find-similar", response_model=SimilarPetsResponse)
async def find_similar_pets(request: SimilarPetsRequest):
    """
    Find similar pets using advanced similarity methods
    """
    try:
        # Find the query pet
        query_pet = None
        for pet in request.pets:
            if pet.id == request.pet_id:
                query_pet = pet.dict()
                break
        
        if not query_pet:
            raise HTTPException(status_code=404, detail="Query pet not found")
        
        # Convert pets to dict format
        pets_dict = [pet.dict() for pet in request.pets]
        
        # Find similar pets
        if request.use_faiss and pet_matching_service.faiss_index:
            similar_results = pet_matching_service.find_similar_pets_faiss(
                query_pet, pets_dict, request.limit
            )
            search_method = "FAISS"
        else:
            similar_results = pet_matching_service.find_similar_pets_sklearn(
                query_pet, pets_dict, request.limit
            )
            search_method = "scikit-learn"
        
        # Format results
        similar_pets = []
        for pet_id, similarity in similar_results:
            # Find the full pet data
            pet_data = next((p for p in pets_dict if p.get('id') == pet_id), None)
            if pet_data:
                similar_pets.append({
                    "pet": pet_data,
                    "similarity_score": similarity,
                    "pet_id": pet_id
                })
        
        return SimilarPetsResponse(
            similar_pets=similar_pets,
            search_method=search_method,
            query_pet_id=request.pet_id
        )
        
    except Exception as e:
        logger.error(f"Error finding similar pets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/similarity/advanced-match", response_model=AdvancedMatchResponse)
async def compute_advanced_match(request: AdvancedMatchRequest):
    """
    Compute advanced match score using multiple similarity methods
    """
    try:
        pet_dict = request.pet.dict()
        
        if request.use_advanced:
            # Use advanced match score
            match_score = pet_matching_service.compute_advanced_match_score(
                request.preferences, pet_dict
            )
            method_used = "advanced"
        else:
            # Use basic match score
            match_score = pet_matching_service._calculate_basic_match_score(
                request.preferences, pet_dict
            )
            method_used = "basic"
        
        # Get individual component scores
        cosine_similarity = pet_matching_service.compute_cosine_similarity(
            request.preferences, pet_dict
        )
        rule_based_score = pet_matching_service._calculate_rule_based_score(
            pet_dict, request.preferences
        )
        weighted_score = pet_matching_service.compute_match_score_with_learned_weights(
            request.preferences, pet_dict
        )
        
        # Get text similarity if available
        text_similarity = None
        if pet_matching_service.sentence_model:
            try:
                pet_text = f"{pet_dict.get('description', '')} {pet_dict.get('breed', '')} {pet_dict.get('species', '')}"
                pref_text = f"{request.preferences.get('lifestyle', '')} {request.preferences.get('experience', '')} {request.preferences.get('additionalInfo', '')}"
                
                pet_embedding = pet_matching_service.sentence_model.encode(pet_text)
                pref_embedding = pet_matching_service.sentence_model.encode(pref_text)
                
                text_similarity = float(cosine_similarity([pet_embedding], [pref_embedding])[0][0])
                text_similarity = max(0.0, min(1.0, (text_similarity + 1) / 2))
            except Exception as e:
                logger.warning(f"Could not compute text similarity: {e}")
        
        return AdvancedMatchResponse(
            match_score=match_score,
            cosine_similarity=cosine_similarity,
            rule_based_score=rule_based_score,
            text_similarity=text_similarity,
            weighted_score=weighted_score,
            method_used=method_used
        )
        
    except Exception as e:
        logger.error(f"Error computing advanced match: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 