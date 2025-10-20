import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
# Removed unused PCA import
import joblib
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
import logging

# Try to import advanced libraries
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Log warnings after logger is defined
if not SENTENCE_TRANSFORMERS_AVAILABLE:
    logger.warning("sentence-transformers not available. Using TF-IDF for text similarity.")

if not FAISS_AVAILABLE:
    logger.warning("FAISS not available. Using scikit-learn for similarity search.")

class PetMatchingService:
    def __init__(self):
        self.recommendation_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.scaler = StandardScaler()
        self.interaction_history = []
        self.user_profiles = {}
        self.model_file = 'recommendation_model.joblib'
        self.artifacts_file = 'recommendation_artifacts.joblib'
        
        # NEW: Advanced similarity components
        self.sentence_model = None
        self.faiss_index = None
        self.pet_embeddings = {}
        self.preference_embeddings = {}
        self.label_encoders = {}
        
        # Initialize with sample data to get model started
        self._initialize_with_sample_data()
        
        # Initialize sentence transformer if available
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Initialized sentence transformer for text similarity")
            except Exception as e:
                logger.warning(f"Could not initialize sentence transformer: {e}")
        
        # Fixed dimension to reserve for text embeddings to ensure stable vector sizes
        self._embedding_dims = 50
        # Small epsilon to avoid division by zero during normalization
        self._eps = 1e-8

        # NEW: Feature importance learning
        self.feature_importance = {
            'species': 1.0,
            'size': 1.0,
            'age': 1.0,
            'breed': 1.0,
            'energy_level': 1.0,
            'living_space': 1.0,
            'experience': 1.0,
            'children': 1.0,
            'other_pets': 1.0,
            'budget': 1.0,
            'time_available': 1.0
        }
        self.feature_learning_rate = 0.01
        # Track whether the model has been fitted
        self._model_fitted = False
        self.load_or_initialize_model()

    def _as_list(self, value):
        """Ensure a scalar or None is converted to a list; lists pass through."""
        if value is None:
            return []
        if isinstance(value, list):
            return value
        return [value]

    def _first_scalar(self, v, default=''):
        """Return the first element if v is a list/tuple; return v or default if None.

        This normalizes frontend fields that may arrive as single-element arrays
        into a plain scalar, preventing accidental dtype=object arrays or None
        values flowing into encoders or string methods.
        """
        if isinstance(v, (list, tuple)):
            return v[0] if v else default
        return v if v is not None else default

    def _normalize_preferences(self, preferences: Dict) -> Dict:
        """Normalize preference fields to consistent array-based keys.

        Ensures the presence of array forms: preferredSpecies, preferredSizes,
        preferredAges, preferredBreeds. Accepts singular fallbacks like
        preferredSize/preferredAge.
        """
        if not preferences:
            return {}

        normalized = dict(preferences)

        # Species (already expected as list in most places)
        normalized['preferredSpecies'] = self._as_list(normalized.get('preferredSpecies'))

        # Sizes: prefer preferredSizes (array), fallback to preferredSize (string)
        sizes_vals = normalized.get('preferredSizes')
        if not sizes_vals:
            sizes_vals = normalized.get('preferredSize')
        normalized['preferredSizes'] = self._as_list(sizes_vals)

        # Ages: prefer preferredAges (array), fallback to preferredAge (string)
        ages_vals = normalized.get('preferredAges')
        if not ages_vals:
            ages_vals = normalized.get('preferredAge')
        normalized['preferredAges'] = self._as_list(ages_vals)

        # Breeds
        normalized['preferredBreeds'] = self._as_list(normalized.get('preferredBreeds'))

        return normalized

    def load_or_initialize_model(self):
        """Load existing model or initialize a new one"""
        try:
            # Prefer loading full artifacts bundle if available
            if os.path.exists(self.artifacts_file):
                artifacts = joblib.load(self.artifacts_file)
                self.recommendation_model = artifacts.get('model', RandomForestRegressor(n_estimators=100, random_state=42))
                self.tfidf_vectorizer = artifacts.get('tfidf_vectorizer', self.tfidf_vectorizer)
                self.scaler = artifacts.get('scaler', self.scaler)
                self.label_encoders = artifacts.get('label_encoders', self.label_encoders)
                self._model_fitted = artifacts.get('_model_fitted', True)
                logger.info("Loaded recommendation artifacts (model + vectorizer/scaler/encoders)")
                return

            if os.path.exists(self.model_file):
                self.recommendation_model = joblib.load(self.model_file)
                logger.info("Loaded existing recommendation model")
                # A loaded model is assumed to be fitted
                self._model_fitted = True
            else:
                self.recommendation_model = RandomForestRegressor(n_estimators=100, random_state=42)
                logger.info("Initialized new recommendation model")
                self._model_fitted = False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.recommendation_model = RandomForestRegressor(n_estimators=100, random_state=42)
            self._model_fitted = False

    def save_model(self):
        """Save the trained model"""
        try:
            # Save full artifacts bundle for consistency across restarts
            artifacts = {
                'model': self.recommendation_model,
                'tfidf_vectorizer': self.tfidf_vectorizer,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                '_model_fitted': True,
            }
            joblib.dump(artifacts, self.artifacts_file)
            # Also save legacy single-model file for backward compatibility
            try:
                joblib.dump(self.recommendation_model, self.model_file)
            except Exception:
                pass
            logger.info("Saved recommendation artifacts (model + vectorizer/scaler/encoders)")
        except Exception as e:
            logger.error(f"Error saving model: {e}")

    def _ensure_tfidf_fitted(self, corpus: List[str]):
        """Ensure the TF-IDF vectorizer is fitted once; if not, fit on provided corpus."""
        try:
            # A fitted TfidfVectorizer has a vocabulary_
            if getattr(self.tfidf_vectorizer, 'vocabulary_', None):
                return
            # Fit on corpus and persist artifacts
            self.tfidf_vectorizer.fit(corpus or [])
            # Save artifacts so subsequent runs reuse the same vocabulary
            self.save_model()
            logger.info("TF-IDF vectorizer fitted on initial corpus and persisted")
        except Exception as e:
            logger.warning(f"Failed to fit TF-IDF vectorizer: {e}")

    def _ensure_scaler_fitted(self, X: np.ndarray):
        """Ensure the StandardScaler is fitted; if not, fit on provided matrix."""
        try:
            if getattr(self.scaler, 'mean_', None) is not None:
                return
            if X is None or X.size == 0:
                return
            self.scaler.fit(X)
            # Persist updated scaler
            self.save_model()
            logger.info("StandardScaler fitted on training features and persisted")
        except Exception as e:
            logger.warning(f"Failed to fit StandardScaler: {e}")

    # Removed unused _create_feature_matrix to reduce dead code and surface area

    def _extract_pet_features(self, pet: Dict) -> Dict:
        """Extract numerical features from pet data"""
        features = {}
        
        # Age conversion
        features['age_numeric'] = self._age_to_numeric(pet.get('age', ''))
        
        # Size conversion
        features['size_numeric'] = self._size_to_numeric(pet.get('size', ''))
        
        # Species conversion
        features['species_numeric'] = self._species_to_numeric(pet.get('species', ''))
        
        # Photo features
        features['has_photos'] = 1 if pet.get('photos') and len(pet['photos']) > 0 else 0
        features['photo_count'] = len(pet.get('photos', []))
        
        # Description features
        features['description_length'] = len(pet.get('description', ''))
        
        # Time features
        if pet.get('created_at'):
            try:
                created_date = datetime.fromisoformat(pet['created_at'].replace('Z', '+00:00'))
                if created_date.tzinfo is None:
                    created_date = created_date.replace(tzinfo=timezone.utc)
                now_utc = datetime.now(timezone.utc)
                days_listed = (now_utc - created_date.astimezone(timezone.utc)).days
                features['days_listed'] = days_listed
            except:
                features['days_listed'] = 0
        else:
            features['days_listed'] = 0
        
        # Interaction features
        features['view_count'] = pet.get('view_count', 0)
        features['favorite_count'] = pet.get('favorite_count', 0)
        features['chat_count'] = pet.get('chat_count', 0)
        
        # Health and behavior scores
        features['health_score'] = self._calculate_health_score(pet)
        features['behavior_score'] = self._calculate_behavior_score(pet)
        
        return features

    def _age_to_numeric(self, age: str) -> int:
        """Convert age string to numeric value"""
        age = (age or '').lower()
        if age in ('kitten', 'puppy', 'baby'):
            age = 'young'
        age_mapping = {
            'young': 1,
            'adult': 2,
            'senior': 3
        }
        return age_mapping.get(age, 2)

    def _size_to_numeric(self, size: str) -> int:
        """Convert size string to numeric value"""
        size_mapping = {
            'small': 1,
            'medium': 2,
            'large': 3
        }
        return size_mapping.get(size.lower(), 2)

    def _species_to_numeric(self, species: str) -> int:
        """Convert species string to numeric value"""
        species_mapping = {
            'dog': 1,
            'cat': 2,
            'bird': 3,
            'reptile': 4,
            'exotic': 5,
            'other': 6
        }
        return species_mapping.get(species.lower(), species_mapping['other'])

    def _calculate_health_score(self, pet: Dict) -> float:
        """Calculate health score based on health records"""
        health_records = pet.get('health_records', [])
        if not health_records:
            return 0.5  # Default score
        
        # Simple scoring based on recent health records
        recent_records = [r for r in health_records if r.get('date')]
        if recent_records:
            return 0.8  # Good health records
        return 0.5

    def _calculate_behavior_score(self, pet: Dict) -> float:
        """Calculate behavior score based on behavior records"""
        behavior_records = pet.get('behavior_records', [])
        if not behavior_records:
            return 0.5  # Default score
        
        # Simple scoring based on behavior records
        positive_behaviors = [r for r in behavior_records if r.get('severity') == 'low']
        negative_behaviors = [r for r in behavior_records if r.get('severity') == 'high']
        
        if len(positive_behaviors) > len(negative_behaviors):
            return 0.8  # Good behavior
        elif len(negative_behaviors) > len(positive_behaviors):
            return 0.3  # Poor behavior
        else:
            return 0.5  # Neutral

    def _extract_user_features(self, user: Dict, preferences: Dict) -> Dict:
        """Extract numerical features from user data and preferences"""
        features = {}
        
        # Experience level
        features['experience_level'] = self._experience_to_numeric(preferences.get('experience', ''))
        
        # Living space
        features['living_space'] = self._living_space_to_numeric(preferences.get('livingSpace', ''))
        
        # Time availability
        features['time_available'] = self._time_available_to_numeric(preferences.get('timeAvailable', ''))
        
        # Family situation
        features['has_children'] = 1 if preferences.get('hasChildren') == 'yes' else 0
        features['has_other_pets'] = 1 if preferences.get('hasOtherPets') == 'yes' else 0
        
        # Preference counts
        features['preferred_species_count'] = len(preferences.get('preferredSpecies', []))
        
        # Interaction counts
        interaction_history = user.get('interactionHistory', [])
        features['view_count'] = len([i for i in interaction_history if i.get('type') == 'view'])
        features['favorite_count'] = len([i for i in interaction_history if i.get('type') == 'favorite'])
        features['chat_count'] = len([i for i in interaction_history if i.get('type') == 'chat'])
        features['adoption_count'] = len([i for i in interaction_history if i.get('type') == 'adopt'])
        
        return features

    def _experience_to_numeric(self, experience: str) -> int:
        """Convert experience string to numeric value"""
        experience_mapping = {
            'first-time': 1,
            'some-experience': 2,
            'experienced': 3
        }
        return experience_mapping.get(experience, 2)

    def _living_space_to_numeric(self, living_space: str) -> int:
        """Convert living space string to numeric value"""
        living_space_mapping = {
            'apartment': 1,
            'house': 2,
            'yard': 3
        }
        return living_space_mapping.get(living_space, 2)

    def _time_available_to_numeric(self, time_available: str) -> int:
        """Convert time available string to numeric value"""
        time_mapping = {
            'minimal': 1,
            'moderate': 2,
            'significant': 3
        }
        return time_mapping.get(time_available, 2)

    def record_user_interaction(self, user_id: str, pet_id: str, interaction_type: str, pet_data: Dict, user_data: Dict, timestamp: datetime = None):
        """Record user interaction for learning"""
        interaction = {
            'user_id': user_id,
            'pet_id': pet_id,
            'interaction_type': interaction_type,
            'pet_data': pet_data,
            'user_data': user_data,
            'timestamp': timestamp or datetime.now(timezone.utc)
        }
        
        self.interaction_history.append(interaction)
        
        # Update user profile
        self._update_user_preferences(user_id, interaction)
        
        logger.info(f"Recorded {interaction_type} interaction for user {user_id}")

    def record_recommendation_feedback(self, user_id: str, pet_id: str, feedback_type: str, reason: str, 
                                     details: str = None, user_preferences: Dict = None, pet_attributes: Dict = None,
                                     recommendation_score: float = None, session_id: str = None, timestamp: datetime = None):
        """Record feedback on recommendations for enhanced learning"""
        feedback = {
            'user_id': user_id,
            'pet_id': pet_id,
            'feedback_type': feedback_type,  # 'positive', 'negative', 'neutral'
            'reason': reason,
            'details': details,
            'user_preferences': user_preferences or {},
            'pet_attributes': pet_attributes or {},
            'recommendation_score': recommendation_score,
            'session_id': session_id,
            'timestamp': timestamp or datetime.now(timezone.utc)
        }
        
        # Store feedback for learning
        if not hasattr(self, 'feedback_history'):
            self.feedback_history = []
        self.feedback_history.append(feedback)
        
        # Update user preferences based on feedback
        self._update_user_preferences_from_feedback(user_id, feedback)
        
        # NEW: Update feature importance based on feedback
        self.update_feature_importance_from_feedback(feedback)
        
        # Calculate learning impact
        learning_impact = {
            'feedback_count': len(self.feedback_history),
            'user_feedback_count': len([f for f in self.feedback_history if f['user_id'] == user_id]),
            'feedback_type': feedback_type,
            'reason_categories': self._categorize_feedback_reason(reason),
            'preference_updates': self._get_preference_updates_from_feedback(feedback),
            'feature_importance_updated': True,
            'current_feature_importance': self.feature_importance
        }
        
        logger.info(f"Recorded {feedback_type} feedback for user {user_id}: {reason}")
        logger.info(f"Updated feature importance: {self.feature_importance}")
        return learning_impact

    def _update_user_preferences(self, user_id: str, interaction: Dict):
        """Update user preferences based on interaction"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                'species_preferences': {},
                'size_preferences': {},
                'age_preferences': {}
            }
        
        pet_data = interaction['pet_data']
        interaction_type = interaction['interaction_type']
        
        # Weight different interaction types
        weights = {
            'view': 0.1,
            'favorite': 0.5,
            'chat': 0.3,
            'adopt': 1.0,
            'ignore': -0.2
        }
        
        weight = weights.get(interaction_type, 0.1)
        
        # Update species preference
        species = pet_data.get('species', '')
        if species:
            current = self.user_profiles[user_id]['species_preferences'].get(species, 0)
            self.user_profiles[user_id]['species_preferences'][species] = current + weight
        
        # Update size preference
        size = pet_data.get('size', '')
        if size:
            current = self.user_profiles[user_id]['size_preferences'].get(size, 0)
            self.user_profiles[user_id]['size_preferences'][size] = current + weight
        
        # Update age preference
        age = pet_data.get('age', '')
        if age:
            current = self.user_profiles[user_id]['age_preferences'].get(age, 0)
            self.user_profiles[user_id]['age_preferences'][age] = current + weight

    def _update_user_preferences_from_feedback(self, user_id: str, feedback: Dict):
        """Update user preferences based on feedback"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {'preferences': {}, 'feedback_history': []}
        
        # Add feedback to user profile
        self.user_profiles[user_id]['feedback_history'].append(feedback)
        
        # Update preferences based on feedback type
        if feedback['feedback_type'] == 'positive':
            # Strengthen preferences that led to positive feedback
            self._strengthen_preferences(user_id, feedback)
        elif feedback['feedback_type'] == 'negative':
            # Weaken preferences that led to negative feedback
            self._weaken_preferences(user_id, feedback)
        
        logger.info(f"Updated preferences for user {user_id} based on {feedback['feedback_type']} feedback")

    def _strengthen_preferences(self, user_id: str, feedback: Dict):
        """Strengthen user preferences based on positive feedback"""
        pet_attrs = feedback['pet_attributes']
        user_prefs = feedback['user_preferences']
        
        # Strengthen matching preferences
        if pet_attrs.get('species') and user_prefs.get('preferredSpecies'):
            if pet_attrs['species'] in user_prefs['preferredSpecies']:
                self._update_preference_strength(user_id, 'preferredSpecies', pet_attrs['species'], 0.1)
        
        if pet_attrs.get('size') and user_prefs.get('preferredSizes'):
            if pet_attrs['size'] in user_prefs['preferredSizes']:
                self._update_preference_strength(user_id, 'preferredSizes', pet_attrs['size'], 0.1)
        
        if pet_attrs.get('age') and user_prefs.get('preferredAges'):
            if pet_attrs['age'] in user_prefs['preferredAges']:
                self._update_preference_strength(user_id, 'preferredAges', pet_attrs['age'], 0.1)

    def _weaken_preferences(self, user_id: str, feedback: Dict):
        """Weaken user preferences based on negative feedback"""
        pet_attrs = feedback['pet_attributes']
        user_prefs = feedback['user_preferences']
        
        # Weaken mismatching preferences
        if pet_attrs.get('species') and user_prefs.get('preferredSpecies'):
            if pet_attrs['species'] in user_prefs['preferredSpecies']:
                self._update_preference_strength(user_id, 'preferredSpecies', pet_attrs['species'], -0.1)
        
        if pet_attrs.get('size') and user_prefs.get('preferredSizes'):
            if pet_attrs['size'] in user_prefs['preferredSizes']:
                self._update_preference_strength(user_id, 'preferredSizes', pet_attrs['size'], -0.1)
        
        if pet_attrs.get('age') and user_prefs.get('preferredAges'):
            if pet_attrs['age'] in user_prefs['preferredAges']:
                self._update_preference_strength(user_id, 'preferredAges', pet_attrs['age'], -0.1)

    def _update_preference_strength(self, user_id: str, preference_key: str, value: str, delta: float):
        """Update the strength of a specific preference"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {'preferences': {}, 'feedback_history': []}
        
        if 'preference_strengths' not in self.user_profiles[user_id]:
            self.user_profiles[user_id]['preference_strengths'] = {}
        
        if preference_key not in self.user_profiles[user_id]['preference_strengths']:
            self.user_profiles[user_id]['preference_strengths'][preference_key] = {}
        
        if value not in self.user_profiles[user_id]['preference_strengths'][preference_key]:
            self.user_profiles[user_id]['preference_strengths'][preference_key][value] = 1.0
        
        # Update strength (clamp between 0.1 and 2.0)
        current_strength = self.user_profiles[user_id]['preference_strengths'][preference_key][value]
        new_strength = max(0.1, min(2.0, current_strength + delta))
        self.user_profiles[user_id]['preference_strengths'][preference_key][value] = new_strength

    def _categorize_feedback_reason(self, reason: str) -> List[str]:
        """Categorize feedback reasons for analysis"""
        categories = []
        reason_lower = reason.lower()
        
        if any(word in reason_lower for word in ['size', 'small', 'large', 'medium']):
            categories.append('size_preference')
        if any(word in reason_lower for word in ['age', 'young', 'old', 'adult', 'senior']):
            categories.append('age_preference')
        if any(word in reason_lower for word in ['breed', 'species', 'dog', 'cat']):
            categories.append('species_preference')
        if any(word in reason_lower for word in ['energy', 'active', 'calm', 'lazy']):
            categories.append('energy_level')
        if any(word in reason_lower for word in ['apartment', 'house', 'yard']):
            categories.append('living_space')
        if any(word in reason_lower for word in ['children', 'kids', 'family']):
            categories.append('family_compatibility')
        if any(word in reason_lower for word in ['other pets', 'dogs', 'cats']):
            categories.append('pet_compatibility')
        
        return categories

    def _get_preference_updates_from_feedback(self, feedback: Dict) -> Dict:
        """Get preference updates based on feedback"""
        updates = {}
        pet_attrs = feedback['pet_attributes']
        
        # Analyze pet attributes that influenced feedback
        for attr, value in pet_attrs.items():
            if attr in ['species', 'size', 'age', 'breed']:
                updates[f'{attr}_preference'] = {
                    'value': value,
                    'feedback_type': feedback['feedback_type'],
                    'reason': feedback['reason']
                }
        
        return updates

    def _initialize_with_sample_data(self):
        """Initialize the model with sample data to get it started"""
        try:
            # Create sample interactions for training
            sample_interactions = [
                {
                    'user_data': {
                        'id': 'sample_user_1',
                        'preferences': {
                            'preferredSpecies': ['dog'],
                            'preferredSizes': ['medium'],
                            'preferredAges': ['adult'],
                            'experience': 'first-time',
                            'livingSpace': 'apartment',
                            'hasChildren': 'no',
                            'hasOtherPets': 'no'
                        },
                        'interactionHistory': []
                    },
                    'pet_data': {
                        'id': 'sample_pet_1',
                        'name': 'Sample Dog',
                        'species': 'dog',
                        'breed': 'Golden Retriever',
                        'age': 'adult',
                        'size': 'large',
                        'description': 'Friendly and energetic',
                        'photos': [],
                        'health_records': [],
                        'behavior_records': [],
                        'created_at': '2024-01-01T00:00:00Z',
                        'view_count': 10,
                        'favorite_count': 5,
                        'chat_count': 2
                    },
                    'interaction_type': 'favorite'
                },
                {
                    'user_data': {
                        'id': 'sample_user_2',
                        'preferences': {
                            'preferredSpecies': ['cat'],
                            'preferredSizes': ['small'],
                            'preferredAges': ['kitten'],
                            'experience': 'experienced',
                            'livingSpace': 'house',
                            'hasChildren': 'yes',
                            'hasOtherPets': 'yes'
                        },
                        'interactionHistory': []
                    },
                    'pet_data': {
                        'id': 'sample_pet_2',
                        'name': 'Sample Cat',
                        'species': 'cat',
                        'breed': 'Persian',
                        'age': 'kitten',
                        'size': 'small',
                        'description': 'Calm and gentle',
                        'photos': [],
                        'health_records': [],
                        'behavior_records': [],
                        'created_at': '2024-01-01T00:00:00Z',
                        'view_count': 15,
                        'favorite_count': 8,
                        'chat_count': 3
                    },
                    'interaction_type': 'adopt'
                }
            ]
            
            # Add more sample data
            for i in range(3, 15):
                sample_interactions.append({
                    'user_data': {
                        'id': f'sample_user_{i}',
                        'preferences': {
                            'preferredSpecies': [["dog", "cat"][i % 2]],
                            'preferredSizes': [["small", "medium", "large"][i % 3]],
                            'preferredAges': [["kitten", "adult", "senior"][i % 3]],
                            'experience': ['first-time', 'some-experience', 'experienced'][i % 3],
                            'livingSpace': ['apartment', 'house'][i % 2],
                            'hasChildren': ['yes', 'no'][i % 2],
                            'hasOtherPets': ['yes', 'no'][i % 2]
                        },
                        'interactionHistory': []
                    },
                    'pet_data': {
                        'id': f'sample_pet_{i}',
                        'name': f'Sample Pet {i}',
                        'species': ['dog', 'cat', 'bird', 'reptile'][i % 4],
                        'breed': f'Breed {i}',
                        'age': ['kitten', 'adult', 'senior'][i % 3],
                        'size': ['small', 'medium', 'large'][i % 3],
                        'description': f'Description for pet {i}',
                        'photos': [],
                        'health_records': [],
                        'behavior_records': [],
                        'created_at': '2024-01-01T00:00:00Z',
                        'view_count': i * 2,
                        'favorite_count': i,
                        'chat_count': i // 2
                    },
                    'interaction_type': ['view', 'favorite', 'chat', 'adopt', 'ignore'][i % 5]
                })
            
            # Train the model with sample data
            self.train_model(sample_interactions)
            logger.info("Initialized model with sample data")
            
        except Exception as e:
            logger.error(f"Error initializing with sample data: {e}")

    def train_model(self, interactions: List[Dict] = None):
        """Train the recommendation model"""
        if not interactions:
            interactions = self.interaction_history
        
        if len(interactions) < 10:
            logger.info("Not enough interactions to train model")
            return
        
        try:
            # Prepare training data
            X = []
            y = []
            # Build TF-IDF corpus from pet descriptions observed in training interactions
            tfidf_corpus: List[str] = []
            
            for interaction in interactions:
                user_data = interaction['user_data']
                pet_data = interaction['pet_data']
                
                # Accumulate text for initial TF-IDF fitting (one-time)
                tfidf_corpus.append(f"{pet_data.get('description', '')} {pet_data.get('temperament', '')} {pet_data.get('health_status', '')} {pet_data.get('behavior_notes', '')}")

                # Extract features
                user_features = self._extract_user_features(user_data, user_data.get('preferences', {}))
                pet_features = self._extract_pet_features(pet_data)
                
                # Combine features
                combined_features = list(user_features.values()) + list(pet_features.values())
                X.append(combined_features)
                
                # Target: interaction weight
                interaction_weights = {
                    'view': 0.1,
                    'favorite': 0.5,
                    'chat': 0.3,
                    'adopt': 1.0,
                    'ignore': 0.0
                }
                y.append(interaction_weights.get(interaction['interaction_type'], 0.1))
            
            # Fit TF-IDF once if not already fitted
            self._ensure_tfidf_fitted(tfidf_corpus)

            # Train model
            X = np.array(X)
            y = np.array(y)
            # Fit scaler (once) and transform features for stable model training
            self._ensure_scaler_fitted(X)
            try:
                X = self.scaler.transform(X)
            except Exception:
                pass
            
            self.recommendation_model.fit(X, y)
            self.save_model()
            # Mark model as fitted after successful training
            self._model_fitted = True
            
            logger.info(f"Model trained successfully with {len(interactions)} interactions")
            
        except Exception as e:
            logger.error(f"Error training model: {e}")

    def predict_match_score(self, user_data: Dict, pet_data: Dict) -> float:
        """Predict match score using trained ML model or fallback scoring"""
        try:
            # Check if model is trained
            if not getattr(self, '_model_fitted', False):
                # Use fallback scoring when model is not trained
                return self._fallback_match_score(user_data, pet_data)
            
            # Extract features
            user_features = self._extract_user_features(user_data, user_data.get('preferences', {}))
            pet_features = self._extract_pet_features(pet_data)
            
            # Combine features
            combined_features = list(user_features.values()) + list(pet_features.values())
            X = np.array([combined_features])
            # Apply scaler if available
            try:
                if getattr(self.scaler, 'mean_', None) is not None:
                    X = self.scaler.transform(X)
            except Exception:
                pass
            
            # Predict
            prediction = self.recommendation_model.predict(X)[0]
            return max(0.0, min(1.0, prediction))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Error predicting match score: {e}")
            # If prediction fails, mark model as not fitted to avoid repeated failures
            self._model_fitted = False
            return self._fallback_match_score(user_data, pet_data)
    
    def _fallback_match_score(self, user_data: Dict, pet_data: Dict) -> float:
        """Fallback scoring mechanism when ML model is not trained"""
        try:
            score = 0.5  # Base score
            
            # User preferences matching
            preferences = user_data.get('preferences', {})
            
            # Species preference
            preferred_species = preferences.get('preferredSpecies', [])
            if pet_data.get('species') in preferred_species:
                score += 0.2
            
            # Size preference
            preferred_size = preferences.get('preferredSize', '')
            if preferred_size and pet_data.get('size') == preferred_size:
                score += 0.1
            
            # Age preference
            preferred_age = preferences.get('preferredAge', '')
            if preferred_age and pet_data.get('age') == preferred_age:
                score += 0.1
            
            # Experience level matching
            experience = preferences.get('experience', '')
            pet_species = pet_data.get('species', '')
            
            if experience == 'first-time' and pet_species in ['dog', 'cat']:
                score += 0.1  # Good for first-time owners
            elif experience == 'experienced' and pet_species in ['reptile', 'bird', 'exotic']:
                score += 0.1  # Good for experienced owners
            
            # Living space compatibility
            living_space = preferences.get('livingSpace', '')
            pet_size = pet_data.get('size', '')
            
            if living_space == 'apartment' and pet_size in ['small', 'medium']:
                score += 0.1
            elif living_space == 'house' and pet_size in ['large', 'extra-large']:
                score += 0.1
            
            # Pet popularity (based on view/favorite counts)
            view_count = pet_data.get('view_count', 0)
            favorite_count = pet_data.get('favorite_count', 0)
            
            if view_count > 10:
                score += 0.05
            if favorite_count > 5:
                score += 0.05
            
            # Health and behavior scores
            health_score = self._calculate_health_score(pet_data)
            behavior_score = self._calculate_behavior_score(pet_data)
            
            score += (health_score - 0.5) * 0.1  # Health bonus/penalty
            score += (behavior_score - 0.5) * 0.1  # Behavior bonus/penalty
            
            return max(0.0, min(1.0, score))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Error in fallback scoring: {e}")
            return 0.5

    def get_ml_recommendations(self, user_data: Dict, pets: List[Dict], preferences: Dict, limit: int = 10) -> List[Dict]:
        """Get ML-based recommendations"""
        recommendations = []
        
        for pet in pets:
            # Get ML prediction
            ml_score = self.predict_match_score(user_data, pet)
            
            # Get rule-based score as fallback
            rule_score = self._calculate_rule_based_score(pet, preferences)
            
            # Get learned preference bonus
            learned_bonus = self._get_learned_preference_bonus(user_data.get('id', ''), pet)
            
            # Combine scores
            combined_score = 0.7 * ml_score + 0.3 * rule_score + learned_bonus
            final_score = max(0.0, min(1.0, combined_score))
            
            # Generate explanation
            explanation = self._generate_ml_explanation(pet, ml_score, rule_score, learned_bonus)
            
            recommendations.append({
                'pet': pet,
                'score': final_score,
                'ml_score': ml_score,
                'rule_score': rule_score,
                'learned_bonus': learned_bonus,
                'explanation': explanation
            })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]

    def _calculate_rule_based_score(self, pet: Dict, preferences: Dict) -> float:
        """Calculate rule-based score"""
        score = 0.0
        
        # Helper function to safely get array values
        def get_array_value(value):
            if not value:
                return []
            if isinstance(value, list):
                return value
            return [value]
        
        # Species preference - handle both array and string formats
        preferred_species = get_array_value(preferences.get('preferredSpecies'))
        if preferred_species and pet.get('species') in preferred_species:
            score += 0.3
        
        # Size preference - handle both array and string formats
        living_space = get_array_value(preferences.get('livingSpace'))
        if 'apartment' in living_space and pet.get('size') == 'small':
            score += 0.2
        elif 'yard' in living_space and pet.get('size') == 'large':
            score += 0.2
        
        # Experience level - handle both array and string formats
        experience = get_array_value(preferences.get('experience'))
        if 'first-time' in experience and pet.get('age') == 'adult':
            score += 0.2
        
        # Time availability - handle both array and string formats
        time_available = get_array_value(preferences.get('timeAvailable'))
        if 'minimal' in time_available and pet.get('species') == 'cat':
            score += 0.1
        
        # Add some base scoring to prevent all pets from getting 0.0
        # This ensures some differentiation even with empty preferences
        base_score = 0.1  # 10% base score for all pets
        
        return min(1.0, score + base_score)

    def _get_learned_preference_bonus(self, user_id: str, pet: Dict) -> float:
        """Get bonus score based on learned preferences"""
        if user_id not in self.user_profiles:
            return 0.0
        
        profile = self.user_profiles[user_id]
        bonus = 0.0
        
        # Species bonus
        species = pet.get('species', '')
        if species in profile['species_preferences']:
            bonus += min(0.1, profile['species_preferences'][species] * 0.02)
        
        # Size bonus
        size = pet.get('size', '')
        if size in profile['size_preferences']:
            bonus += min(0.1, profile['size_preferences'][size] * 0.02)
        
        # Age bonus
        age = pet.get('age', '')
        if age in profile['age_preferences']:
            bonus += min(0.1, profile['age_preferences'][age] * 0.02)
        
        return bonus

    def _generate_ml_explanation(self, pet: Dict, ml_score: float, rule_score: float, learned_bonus: float) -> str:
        """Generate explanation for ML recommendation"""
        explanations = []
        
        if ml_score > 0.7:
            explanations.append("AI model strongly recommends this pet")
        elif ml_score > 0.5:
            explanations.append("AI model moderately recommends this pet")
        
        if rule_score > 0.6:
            explanations.append("Matches your stated preferences")
        
        if learned_bonus > 0.05:
            explanations.append("Based on your past interactions")
        
        if not explanations:
            explanations.append("This pet might be a good match")
        
        return f"{pet.get('name', 'Pet')}: {'; '.join(explanations)}."

    def get_similar_pets(self, pet_id: str, pets: List[Dict], limit: int = 5) -> List[Dict]:
        """Get similar pets using content-based filtering"""
        target_pet = next((p for p in pets if p['id'] == pet_id), None)
        if not target_pet:
            return []
        
        similarities = []
        for pet in pets:
            if pet['id'] == pet_id:
                continue
            
            similarity = self._calculate_pet_similarity(target_pet, pet)
            similarities.append((pet, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [pet for pet, _ in similarities[:limit]]

    def _calculate_pet_similarity(self, pet1: Dict, pet2: Dict) -> float:
        """Calculate similarity between two pets"""
        similarity = 0.0
        
        # Species similarity
        if pet1.get('species') == pet2.get('species'):
            similarity += 0.3
        
        # Size similarity
        if pet1.get('size') == pet2.get('size'):
            similarity += 0.2
        
        # Age similarity
        if pet1.get('age') == pet2.get('age'):
            similarity += 0.2
        
        # Breed similarity (partial match)
        breed1 = pet1.get('breed', '').lower()
        breed2 = pet2.get('breed', '').lower()
        if breed1 in breed2 or breed2 in breed1:
            similarity += 0.2
        
        return similarity

    def get_user_clusters(self, users: List[Dict]) -> Dict:
        """Cluster users using KMeans"""
        if len(users) < 2:
            return {}
        
        try:
            # Extract user features
            user_features = []
            for user in users:
                features = self._extract_user_features(user, user.get('preferences', {}))
                user_features.append(list(features.values()))
            
            # Cluster users
            kmeans = KMeans(n_clusters=min(3, len(users)), random_state=42, n_init=10)
            clusters = kmeans.fit_predict(user_features)
            
            # Group users by cluster
            cluster_groups = {}
            for i, cluster_id in enumerate(clusters):
                if cluster_id not in cluster_groups:
                    cluster_groups[cluster_id] = []
                cluster_groups[cluster_id].append(users[i])
            
            return cluster_groups
            
        except Exception as e:
            logger.error(f"Error clustering users: {e}")
            return {}

    def get_collaborative_recommendations(self, user_id: str, users: List[Dict], pets: List[Dict]) -> List[Dict]:
        """Get collaborative filtering recommendations"""
        # Find similar users
        user_clusters = self.get_user_clusters(users)
        
        # Find user's cluster
        user_cluster = None
        for cluster_id, cluster_users in user_clusters.items():
            if any(u.get('id') == user_id for u in cluster_users):
                user_cluster = cluster_id
                break
        
        if user_cluster is None:
            return []
        
        # Get pets that similar users have interacted with positively
        similar_users = user_clusters[user_cluster]
        positive_interactions = []
        
        for user in similar_users:
            if user.get('id') == user_id:
                continue
            
            user_interactions = [i for i in self.interaction_history if i['user_id'] == user.get('id')]
            positive_interactions.extend([i for i in user_interactions if i['interaction_type'] in ['favorite', 'adopt']])
        
        # Get recommended pets
        recommended_pet_ids = list(set([i['pet_id'] for i in positive_interactions]))
        recommended_pets = [p for p in pets if p['id'] in recommended_pet_ids]
        
        return recommended_pets

    def getLearnedPreferences(self, user_id: str) -> Dict:
        """Get learned preferences for a user"""
        if user_id not in self.user_profiles:
            return {}
        
        profile = self.user_profiles[user_id]
        learned_prefs = {}
        
        # Get preference strengths
        if 'preference_strengths' in profile:
            learned_prefs['preference_strengths'] = profile['preference_strengths']
        
        # Get interaction patterns
        if 'interaction_history' in profile:
            learned_prefs['interaction_patterns'] = {
                'total_interactions': len(profile['interaction_history']),
                'favorite_pets': [i['pet_id'] for i in profile['interaction_history'] if i['interaction_type'] == 'favorite'],
                'viewed_pets': [i['pet_id'] for i in profile['interaction_history'] if i['interaction_type'] == 'view']
            }
        
        return learned_prefs

    def get_user_feedback_history(self, user_id: str) -> List[Dict]:
        """Get feedback history for a user"""
        if user_id not in self.user_profiles:
            return []
        
        profile = self.user_profiles[user_id]
        
        # Get feedback history if available
        if hasattr(self, 'feedback_history'):
            user_feedback = [f for f in self.feedback_history if f['user_id'] == user_id]
            return user_feedback
        
        return []

    # NEW: Methods for the /recommend endpoint
    def compute_match_score(self, preferences: Dict, pet: Dict) -> float:
        """
        Compute match score using advanced similarity methods
        """
        try:
            # Use advanced match score if available
            return self.compute_advanced_match_score(preferences, pet)
        except Exception as e:
            logger.error(f"Error in advanced match score, falling back to basic: {e}")
            return self._calculate_basic_match_score(preferences, pet)

    def _calculate_basic_match_score(self, preferences: Dict, pet: Dict) -> float:
        """
        Basic fallback match score calculation
        """
        # Normalize incoming preferences to consistent list-based keys
        preferences = self._normalize_preferences(preferences)

        score = 0.0
        factors = []
        
        # Species matching
        if preferences.get('preferredSpecies') and pet.get('species'):
            if pet['species'] in preferences['preferredSpecies']:
                score += 0.3
                factors.append('Species match')
        
        # Size matching
        if preferences.get('preferredSizes') and pet.get('size'):
            if pet['size'] in preferences['preferredSizes']:
                score += 0.25
                factors.append('Size match')
        
        # Age matching
        if preferences.get('preferredAges') and pet.get('age'):
            if pet['age'] in preferences['preferredAges']:
                score += 0.2
                factors.append('Age match')
        
        # Breed matching
        if preferences.get('preferredBreeds') and pet.get('breed'):
            if pet['breed'] in preferences['preferredBreeds']:
                score += 0.15
                factors.append('Breed match')
        
        # Living space compatibility
        if preferences.get('livingSpace') and pet.get('size'):
            ls = self._first_scalar(preferences.get('livingSpace'))
            living_space = (ls or '').lower()
            if 'apartment' in living_space and pet['size'] == 'small':
                score += 0.1
                factors.append('Apartment suitable')
            elif 'yard' in living_space and pet['size'] == 'large':
                score += 0.1
                factors.append('Yard suitable')
        
        return min(1.0, score)

    def explain_match(self, preferences: Dict, pet: Dict) -> List[str]:
        """
        Explain why a pet matches the preferences
        This method provides reasons for the match
        """
        # Normalize preferences to avoid string-vs-array issues
        preferences = self._normalize_preferences(preferences)

        reasons = []

        # Scalar normalization for list-capable fields
        living_space = (self._first_scalar(preferences.get('livingSpace')) or '').lower()
        experience = (self._first_scalar(preferences.get('experience')) or '').lower()
        time_available = (self._first_scalar(preferences.get('timeAvailable')) or '').lower()

        # Species preference
        if preferences.get('preferredSpecies') and pet.get('species') in preferences['preferredSpecies']:
            reasons.append(f"Matches your preferred species ({pet.get('species')})")

        # Size compatibility
        if living_space == 'apartment' and pet.get('size') == 'small':
            reasons.append("Good for apartment living")
        elif living_space in ('yard', 'house-with-yard') and pet.get('size') == 'large':
            reasons.append("Great for homes with yards")
        elif living_space == 'house' and pet.get('size') == 'medium':
            reasons.append("Perfect for house living")

        # Experience level compatibility
        if experience == 'first-time' and (pet.get('age') in ('adult', 'young')):
            reasons.append("Good for first-time owners")
        elif experience == 'experienced' and pet.get('age') == 'young':
            reasons.append("Perfect for experienced owners")

        # Time availability compatibility
        if time_available == 'minimal' and pet.get('species') == 'cat':
            reasons.append("Low maintenance")
        elif time_available in ('significant', 'high') and pet.get('species') == 'dog':
            reasons.append("Needs active lifestyle")

        # Children compatibility
        if (self._first_scalar(preferences.get('hasChildren')) or '').lower() == 'yes' and pet.get('age') == 'adult':
            reasons.append("Good with children")

        # Other pets compatibility
        if (self._first_scalar(preferences.get('hasOtherPets')) or '').lower() == 'yes':
            reasons.append("Good with other pets")
        
        # Health and behavior
        if pet.get('health_records'):
            reasons.append("Good health records")
        
        if pet.get('behavior_records'):
            reasons.append("Well-behaved")
        
        # If no specific reasons, provide a general one
        if not reasons:
            reasons.append("This pet might be a good match for you")
        
        return reasons

    def update_feature_importance_from_feedback(self, feedback: Dict):
        """Update feature importance based on user feedback"""
        feedback_type = feedback.get('feedback_type', 'neutral')
        pet_attrs = feedback.get('pet_attributes', {})
        user_prefs = feedback.get('user_preferences', {})
        
        # Determine if feedback is positive or negative
        is_positive = feedback_type == 'positive'
        learning_direction = 1 if is_positive else -1
        
        # Update importance for features that were relevant in this feedback
        self._update_importance_for_feature('species', pet_attrs.get('species'), user_prefs.get('preferredSpecies'), learning_direction)
        self._update_importance_for_feature('size', pet_attrs.get('size'), user_prefs.get('preferredSizes'), learning_direction)
        self._update_importance_for_feature('age', pet_attrs.get('age'), user_prefs.get('preferredAges'), learning_direction)
        self._update_importance_for_feature('breed', pet_attrs.get('breed'), user_prefs.get('preferredBreeds'), learning_direction)
        
        # Update importance for lifestyle features
        if user_prefs.get('livingSpace'):
            self._update_importance_for_feature('living_space', pet_attrs.get('size'), [user_prefs['livingSpace']], learning_direction)
        
        if user_prefs.get('experience'):
            self._update_importance_for_feature('experience', pet_attrs.get('age'), [user_prefs['experience']], learning_direction)
        
        if user_prefs.get('hasChildren'):
            self._update_importance_for_feature('children', pet_attrs.get('size'), [user_prefs['hasChildren']], learning_direction)
        
        if user_prefs.get('hasOtherPets'):
            self._update_importance_for_feature('other_pets', pet_attrs.get('species'), [user_prefs['hasOtherPets']], learning_direction)
        
        logger.info(f"Updated feature importance based on {feedback_type} feedback")

    def _update_importance_for_feature(self, feature_name: str, pet_value: str, user_preferences: List[str], direction: int):
        """Update importance for a specific feature"""
        if not pet_value or not user_preferences:
            return
        
        # Check if the pet's value matches user preferences
        is_match = pet_value.lower() in [pref.lower() for pref in user_preferences]
        
        if is_match:
            # If it's a match and positive feedback, increase importance
            # If it's a match and negative feedback, decrease importance
            current_importance = self.feature_importance.get(feature_name, 1.0)
            new_importance = current_importance + (direction * self.feature_learning_rate)
            
            # Clamp between 0.1 and 3.0
            self.feature_importance[feature_name] = max(0.1, min(3.0, new_importance))

    def get_feature_importance(self) -> Dict[str, float]:
        """Get current feature importance weights"""
        return self.feature_importance.copy()

    def set_feature_importance(self, importance_weights: Dict[str, float]):
        """Set feature importance weights manually"""
        for feature, weight in importance_weights.items():
            if feature in self.feature_importance:
                self.feature_importance[feature] = max(0.1, min(3.0, weight))
        
        logger.info("Updated feature importance weights")

    def compute_match_score_with_learned_weights(self, preferences: Dict, pet: Dict) -> float:
        """Compute match score using learned feature importance weights"""
        preferences = self._normalize_preferences(preferences)
        # Use basic score directly to avoid recursion
        base_score = self._calculate_basic_match_score(preferences, pet)
        
        # Apply learned feature importance weights
        weighted_score = base_score
        
        # Apply weights based on feature matches
        if pet.get('species') and preferences.get('preferredSpecies'):
            if pet['species'] in preferences['preferredSpecies']:
                weight = self.feature_importance.get('species', 1.0)
                weighted_score *= weight
        
        if pet.get('size') and preferences.get('preferredSizes'):
            if pet['size'] in preferences['preferredSizes']:
                weight = self.feature_importance.get('size', 1.0)
                weighted_score *= weight
        
        if pet.get('age') and preferences.get('preferredAges'):
            if pet['age'] in preferences['preferredAges']:
                weight = self.feature_importance.get('age', 1.0)
                weighted_score *= weight
        
        # Normalize score back to 0-1 range
        return min(1.0, max(0.0, weighted_score))

    def train_feature_importance_model(self, feedback_data: List[Dict] = None):
        """Train feature importance model based on feedback data"""
        if not feedback_data:
            feedback_data = getattr(self, 'feedback_history', [])
        
        if not feedback_data:
            logger.warning("No feedback data available for feature importance training")
            return
        
        logger.info(f"Training feature importance model with {len(feedback_data)} feedback samples")
        
        # Reset feature importance to base values
        for feature in self.feature_importance:
            self.feature_importance[feature] = 1.0
        
        # Process all feedback to update importance
        for feedback in feedback_data:
            self.update_feature_importance_from_feedback(feedback)
        
        logger.info("Feature importance training completed")
        logger.info(f"Final feature importance: {self.feature_importance}")

    def create_pet_vector(self, pet: Dict) -> np.ndarray:
        """
        Create a comprehensive feature vector for a pet
        """
        features = []
        
        # Categorical features (encoded)
        species_encoded = self._encode_categorical('species', pet.get('species', ''))
        size_encoded = self._encode_categorical('size', pet.get('size', ''))
        age_encoded = self._encode_categorical('age', pet.get('age', ''))
        breed_encoded = self._encode_categorical('breed', pet.get('breed', ''))
        
        features.extend([species_encoded, size_encoded, age_encoded, breed_encoded])
        
        # Numerical features
        features.extend([
            pet.get('view_count', 0) or 0,
            pet.get('favorite_count', 0) or 0,
            pet.get('chat_count', 0) or 0,
            len(pet.get('photos') or []),
            len(pet.get('description') or ''),
            pet.get('adoptionFee', 0) or 0,
            self._calculate_health_score(pet),
            self._calculate_behavior_score(pet)
        ])
        
        # Text embedding (fixed size, pad with zeros if unavailable)
        if self.sentence_model:
            try:
                text = f"{(pet.get('description') or '')} {(pet.get('breed') or '')} {(pet.get('species') or '')}"
                text_embedding = np.asarray(self.sentence_model.encode(text), dtype=np.float32)
                # Trim or pad to fixed dims
                if text_embedding.size >= self._embedding_dims:
                    features.extend(text_embedding[:self._embedding_dims])
                else:
                    pad = np.zeros(self._embedding_dims - text_embedding.size, dtype=np.float32)
                    features.extend(np.concatenate([text_embedding, pad]))
            except Exception:
                features.extend(np.zeros(self._embedding_dims, dtype=np.float32))
        else:
            features.extend(np.zeros(self._embedding_dims, dtype=np.float32))
        
        arr = np.array(features, dtype=np.float32)
        arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Ensure we never return None
        if arr is None or not hasattr(arr, 'shape'):
            logger.error("Failed to create pet vector, returning zero vector")
            return np.zeros(50, dtype=np.float32)  # Return a default vector
        
        return arr

    def create_preference_vector(self, preferences: Dict) -> np.ndarray:
        """Create a comprehensive feature vector for user preferences.

        Normalizes any single-element arrays from the frontend into scalars
        before encoding/converting, avoiding dtype=object and None propagation.
        """
        preferences = self._normalize_preferences(preferences)

        features = []

        # Unwrap single values before encoding
        lifestyle = self._first_scalar(preferences.get('lifestyle'))
        experience = self._first_scalar(preferences.get('experience'))
        living_space = self._first_scalar(preferences.get('livingSpace'))
        time_available = self._first_scalar(preferences.get('timeAvailable'))

        features.extend([
            self._encode_categorical('lifestyle', lifestyle),
            self._encode_categorical('experience', experience),
            self._encode_categorical('living_space', living_space),
            self._encode_categorical('time_available', time_available),
        ])

        # Counts on list fields (safe)
        features.extend([
            len(self._as_list(preferences.get('preferredSpecies'))),
            len(self._as_list(preferences.get('preferredSizes'))),
            len(self._as_list(preferences.get('preferredAges'))),
            len(self._as_list(preferences.get('preferredBreeds'))),
            1 if self._first_scalar(preferences.get('hasChildren')) == 'yes' else 0,
            1 if self._first_scalar(preferences.get('hasOtherPets')) == 'yes' else 0,
            (self._first_scalar(preferences.get('maxDistance')) or 50),
            self._budget_to_numeric(self._first_scalar(preferences.get('budget'))),
            self._activity_level_to_numeric(self._first_scalar(preferences.get('activityLevel'))),
        ])

        # Text embedding
        if self.sentence_model:
            try:
                pref_text = f"{lifestyle} {experience} {self._first_scalar(preferences.get('additionalInfo'))}"
                pref_embedding = np.asarray(self.sentence_model.encode(pref_text), dtype=np.float32)
                if pref_embedding.size >= self._embedding_dims:
                    features.extend(pref_embedding[:self._embedding_dims])
                else:
                    pad = np.zeros(self._embedding_dims - pref_embedding.size, dtype=np.float32)
                    features.extend(np.concatenate([pref_embedding, pad]))
            except Exception:
                features.extend(np.zeros(self._embedding_dims, dtype=np.float32))
        else:
            features.extend(np.zeros(self._embedding_dims, dtype=np.float32))

        # Reduce NaN/Inf + cast float
        arr = np.array(features, dtype=np.float32)
        arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Ensure we never return None
        if arr is None or not hasattr(arr, 'shape'):
            logger.error("Failed to create preference vector, returning zero vector")
            return np.zeros(50, dtype=np.float32)  # Return a default vector
        
        return arr

    def _encode_categorical(self, feature_name: str, value: str) -> float:
        """Encode categorical features using LabelEncoder, scaled to [0,1]. Unknown -> 0.0"""
        if feature_name not in self.label_encoders:
            self.label_encoders[feature_name] = LabelEncoder()
            # Initialize with common values
            common_values = self._get_common_values(feature_name)
            self.label_encoders[feature_name].fit(common_values)
        
        try:
            idx = self.label_encoders[feature_name].transform([value or ''])[0]
            num_classes = len(self.label_encoders[feature_name].classes_)
            # Scale to (0,1]; reserve 0.0 for unknowns
            return float(idx + 1) / float(num_classes + 1)
        except ValueError:
            # Unknown category maps to 0.0
            return 0.0

    def _get_common_values(self, feature_name: str) -> List[str]:
        """Get common values for categorical encoding"""
        common_values = {
            'species': ['dog', 'cat', 'bird', 'reptile', 'exotic', 'other'],
            'size': ['small', 'medium', 'large'],
            'age': ['baby', 'young', 'adult', 'senior'],
            'breed': ['unknown', 'mixed', 'labrador', 'golden retriever', 'german shepherd', 'bulldog', 'beagle', 'poodle', 'rottweiler', 'yorkshire terrier', 'boxer', 'dachshund'],
            'lifestyle': ['active', 'moderate', 'calm', 'busy', 'relaxed'],
            'experience': ['first-time', 'experienced', 'expert'],
            'living_space': ['apartment', 'house', 'house-with-yard', 'condo'],
            'time_available': ['low', 'moderate', 'high']
        }
        return common_values.get(feature_name, ['unknown'])

    def _budget_to_numeric(self, budget: str) -> float:
        """Convert budget string to numeric value"""
        budget_mapping = {
            'low': 100,
            'moderate': 300,
            'high': 500,
            'unlimited': 1000
        }
        if not budget:
            return 300
        return budget_mapping.get((budget or '').lower(), 300)

    def _activity_level_to_numeric(self, activity: str) -> float:
        """Convert activity level to numeric value"""
        activity_mapping = {
            'low': 1,
            'moderate': 2,
            'high': 3
        }
        if not activity:
            return 2
        return activity_mapping.get((activity or '').lower(), 2)

    def compute_cosine_similarity(self, preferences: Dict, pet: Dict) -> float:
        try:
            if preferences is None:
                preferences = {}
            if pet is None:
                return 0.5

            pref_vector = self.create_preference_vector(preferences)
            pet_vector = self.create_pet_vector(pet)

            # Additional null checks after vector creation
            if pref_vector is None or pet_vector is None:
                logger.warning("One or both vectors are None after creation")
                return 0.5

            # Ensure vectors are numpy arrays
            try:
                pref_vector = np.asarray(pref_vector, dtype=np.float64)
                pet_vector = np.asarray(pet_vector, dtype=np.float64)
            except Exception as e:
                logger.error(f"Error converting vectors to numpy arrays: {e}")
                return 0.5

            # Check if arrays are valid after conversion
            if pref_vector is None or pet_vector is None or not hasattr(pref_vector, 'shape') or not hasattr(pet_vector, 'shape'):
                logger.warning("Invalid vectors after numpy conversion")
                return 0.5

            pref_vector = np.nan_to_num(pref_vector, nan=0.0, posinf=0.0, neginf=0.0)
            pet_vector = np.nan_to_num(pet_vector, nan=0.0, posinf=0.0, neginf=0.0)

            # Safe shape access with additional checks
            try:
                lp = pref_vector.shape[0] if len(pref_vector.shape) > 0 else 0
                lt = pet_vector.shape[0] if len(pet_vector.shape) > 0 else 0
            except Exception as e:
                logger.error(f"Error accessing vector shapes: {e}")
                return 0.5

            if lp == 0 or lt == 0:
                logger.warning(f"Empty vectors: pref_len={lp}, pet_len={lt}")
                return 0.5

            if lp < lt:
                pref_vector = np.pad(pref_vector, (0, lt - lp), mode="constant", constant_values=0.0)
            elif lt < lp:
                pet_vector = np.pad(pet_vector, (0, lp - lt), mode="constant", constant_values=0.0)

            sim = cosine_similarity(pref_vector.reshape(1, -1), pet_vector.reshape(1, -1))[0, 0]
            return float(max(0.0, min(1.0, (sim + 1.0) / 2.0)))
        except Exception as e:
            try:
                lp = None if 'pref_vector' not in locals() or pref_vector is None else getattr(pref_vector, 'shape', None)
                lt = None if 'pet_vector' not in locals() or pet_vector is None else getattr(pet_vector, 'shape', None)
                dtp = None if 'pref_vector' not in locals() or pref_vector is None else getattr(pref_vector, 'dtype', None)
                dtq = None if 'pet_vector' not in locals() or pet_vector is None else getattr(pet_vector, 'dtype', None)
                logger.error(f"Error computing cosine similarity: {e}; pref_shape={lp}, pref_dtype={dtp}; pet_shape={lt}, pet_dtype={dtq}")
            except Exception:
                logger.error(f"Error computing cosine similarity: {e}")
            return 0.5

    def build_faiss_index(self, pets: List[Dict]) -> None:
        """
        Build FAISS index for fast similarity search
        """
        if not FAISS_AVAILABLE:
            logger.warning("FAISS not available. Skipping index building.")
            return
        
        try:
            # Create pet vectors
            pet_vectors = []
            pet_ids = []
            
            for pet in pets:
                vector = self.create_pet_vector(pet)
                pet_vectors.append(vector)
                pet_ids.append(pet.get('id', pet.get('_id', '')))
            
            # Convert to numpy array
            pet_vectors = np.array(pet_vectors, dtype=np.float32)
            
            # Normalize vectors
            norms = np.linalg.norm(pet_vectors, axis=1, keepdims=True)
            pet_vectors = pet_vectors / np.maximum(norms, self._eps)
            
            # Create FAISS index
            dimension = pet_vectors.shape[1]
            self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
            self.faiss_index.add(pet_vectors)
            
            # Store pet IDs for mapping
            self.pet_ids = pet_ids
            
            logger.info(f"Built FAISS index with {len(pets)} pets")
            
        except Exception as e:
            logger.error(f"Error building FAISS index: {e}")

    def find_similar_pets_faiss(self, query_pet: Dict, pets: List[Dict], k: int = 5) -> List[Tuple[str, float]]:
        """
        Find similar pets using FAISS index
        """
        if not FAISS_AVAILABLE or self.faiss_index is None:
            # Fallback to scikit-learn
            return self.find_similar_pets_sklearn(query_pet, pets, k)
        
        try:
            # Create query vector
            query_vector = self.create_pet_vector(query_pet)
            query_vector = query_vector.reshape(1, -1)
            
            # Normalize query vector
            norm = np.linalg.norm(query_vector)
            query_vector = query_vector / max(norm, self._eps)
            
            # Search
            similarities, indices = self.faiss_index.search(query_vector, k)
            
            # Return results
            results = []
            for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
                if idx < len(self.pet_ids):
                    pet_id = self.pet_ids[idx]
                    results.append((pet_id, float(similarity)))
            
            return results
            
        except Exception as e:
            logger.error(f"Error in FAISS search: {e}")
            return self.find_similar_pets_sklearn(query_pet, pets, k)

    def find_similar_pets_sklearn(self, query_pet: Dict, pets: List[Dict], k: int = 5) -> List[Tuple[str, float]]:
        """
        Find similar pets using scikit-learn cosine similarity
        """
        try:
            query_vector = self.create_pet_vector(query_pet)
            
            similarities = []
            for pet in pets:
                pet_vector = self.create_pet_vector(pet)
                similarity = cosine_similarity([query_vector], [pet_vector])[0][0]
                similarities.append((pet.get('id', pet.get('_id', '')), similarity))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return similarities[:k]
            
        except Exception as e:
            logger.error(f"Error in sklearn similarity search: {e}")
            return []

    def compute_advanced_match_score(self, preferences: Dict, pet: Dict) -> float:
        """
        Compute advanced match score using multiple similarity methods
        """
        try:
            # 1. Cosine similarity between preference and pet vectors
            cosine_score = self.compute_cosine_similarity(preferences, pet)
            
            # 2. Rule-based score
            rule_score = self._calculate_rule_based_score(pet, preferences)
            
            # 3. Text similarity (if sentence transformer available)
            text_similarity = 0.5  # Default
            if self.sentence_model:
                pet_text = f"{pet.get('description', '')} {pet.get('breed', '')} {pet.get('species', '')}"
                pref_lifestyle = self._first_scalar(preferences.get('lifestyle'))
                pref_experience = self._first_scalar(preferences.get('experience'))
                pref_extra = self._first_scalar(preferences.get('additionalInfo'))
                pref_text = f"{pref_lifestyle} {pref_experience} {pref_extra}"

                pet_embedding = np.asarray(self.sentence_model.encode(pet_text), dtype=np.float64)
                pref_embedding = np.asarray(self.sentence_model.encode(pref_text), dtype=np.float64)
                pet_embedding = np.nan_to_num(pet_embedding, nan=0.0, posinf=0.0, neginf=0.0).reshape(1, -1)
                pref_embedding = np.nan_to_num(pref_embedding, nan=0.0, posinf=0.0, neginf=0.0).reshape(1, -1)

                text_similarity = cosine_similarity(pet_embedding, pref_embedding)[0, 0]
                text_similarity = max(0.0, min(1.0, (text_similarity + 1) / 2))
            
            # 4. Apply learned feature importance weights (call basic method to avoid recursion)
            weighted_score = self._calculate_basic_match_score(preferences, pet)
            
            # Combine scores with weights
            final_score = (
                0.3 * cosine_score +
                0.2 * rule_score +
                0.2 * text_similarity +
                0.3 * weighted_score
            )
            
            return max(0.0, min(1.0, final_score))
            
        except Exception as e:
            logger.error(f"Error computing advanced match score: {e}")
            return self._calculate_basic_match_score(preferences, pet)  # Direct fallback to basic