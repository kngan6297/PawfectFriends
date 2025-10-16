<template>
  <div class="pet-adoption-chat">
    <el-card class="chat-header" shadow="hover">
      <template #header>
        <div class="header-content">
          <div class="header-left">
            <h2>🏠 Pet Adoption Chat</h2>
            <p class="subtitle">Connect with potential adopters and discuss adoption experiences</p>
          </div>
          <div class="header-actions">
            <el-button type="success" @click="showPetProfileDialog = true">
              <el-icon><Plus /></el-icon>
              Add Pet Profile
            </el-button>
            <el-button type="primary" @click="showAdoptionInquiryDialog = true">
              <el-icon><ChatDotRound /></el-icon>
              New Inquiry
            </el-button>
          </div>
        </div>
      </template>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">🐕</div>
              <div class="stat-content">
                <h3>{{ availablePets.length }}</h3>
                <p>Available Pets</p>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">🏠</div>
              <div class="stat-content">
                <h3>{{ pendingAdoptions.length }}</h3>
                <p>Pending Adoptions</p>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <h3>{{ successfulAdoptions.length }}</h3>
                <p>Successful Adoptions</p>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">🤝</div>
              <div class="stat-content">
                <h3>{{ activeInquiries.length }}</h3>
                <p>Active Inquiries</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- Pet Profiles Section -->
    <el-card class="pet-profiles" shadow="hover">
      <template #header>
        <h3>🐾 Available Pets</h3>
      </template>
      
      <div class="pet-grid">
        <div
          v-for="pet in availablePets"
          :key="pet.id"
          class="pet-card"
          @click="viewPetProfile(pet)"
        >
          <div class="pet-image">
            <el-image
              :src="pet.image || '/public/assets/p1.png'"
              :alt="pet.name"
              fit="cover"
            />
            <div class="pet-status">
              <el-tag :type="getStatusColor(pet.status)" size="small">
                {{ pet.status }}
              </el-tag>
            </div>
          </div>
          
          <div class="pet-info">
            <h4>{{ pet.name }}</h4>
            <p class="pet-breed">{{ pet.breed }}</p>
            <p class="pet-age">{{ pet.age }} years old</p>
            <p class="pet-location">{{ pet.location }}</p>
            
            <div class="pet-tags">
              <el-tag
                v-for="tag in pet.tags.slice(0, 3)"
                :key="tag"
                size="small"
                class="tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="pet-actions">
            <el-button type="primary" size="small" @click.stop="startAdoptionInquiry(pet)">
              Adopt Me
            </el-button>
            <el-button type="info" size="small" @click.stop="viewPetDetails(pet)">
              Details
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Adoption Inquiries Section -->
    <el-card class="adoption-inquiries" shadow="hover">
      <template #header>
        <h3>💬 Adoption Inquiries</h3>
      </template>
      
      <div class="inquiries-list">
        <div
          v-for="inquiry in activeInquiries"
          :key="inquiry.id"
          class="inquiry-item"
          :class="inquiry.urgency"
        >
          <div class="inquiry-header">
            <div class="inquiry-pet">
              <el-avatar :size="40" :src="inquiry.petImage || '/public/assets/p1.png'" />
              <div class="pet-details">
                <h4>{{ inquiry.petName }}</h4>
                <p>{{ inquiry.petBreed }}</p>
              </div>
            </div>
            <div class="inquiry-meta">
              <el-tag :type="getUrgencyColor(inquiry.urgency)" size="small">
                {{ inquiry.urgency }}
              </el-tag>
              <span class="inquiry-date">{{ formatDate(inquiry.createdAt) }}</span>
            </div>
          </div>
          
          <div class="inquiry-content">
            <p class="inquiry-message">{{ inquiry.message }}</p>
            <div class="inquiry-details">
              <span><strong>From:</strong> {{ inquiry.senderName }}</span>
              <span><strong>Contact:</strong> {{ inquiry.contactInfo }}</span>
              <span><strong>Location:</strong> {{ inquiry.location }}</span>
            </div>
          </div>
          
          <div class="inquiry-actions">
            <el-button type="success" size="small" @click="approveAdoption(inquiry)">
              Approve
            </el-button>
            <el-button type="warning" size="small" @click="requestMoreInfo(inquiry)">
              Request Info
            </el-button>
            <el-button type="danger" size="small" @click="declineAdoption(inquiry)">
              Decline
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Add Pet Profile Dialog -->
    <el-dialog v-model="showPetProfileDialog" title="Add Pet Profile" width="700px">
      <el-form :model="petForm" :rules="petRules" ref="petFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Pet Name" prop="name">
              <el-input v-model="petForm.name" placeholder="Enter pet name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Species" prop="species">
              <el-select v-model="petForm.species" placeholder="Select species">
                <el-option label="Dog" value="dog" />
                <el-option label="Cat" value="cat" />
                <el-option label="Bird" value="bird" />
                <el-option label="Small Animal" value="small_animal" />
                <el-option label="Other" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Breed" prop="breed">
              <el-input v-model="petForm.breed" placeholder="Enter breed" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Age" prop="age">
              <el-input-number v-model="petForm.age" :min="0" :max="25" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Description" prop="description">
          <el-input
            v-model="petForm.description"
            type="textarea"
            :rows="3"
            placeholder="Describe the pet's personality, needs, and any special requirements"
          />
        </el-form-item>
        
        <el-form-item label="Tags" prop="tags">
          <el-select
            v-model="petForm.tags"
            multiple
            filterable
            allow-create
            placeholder="Select or create tags"
          >
            <el-option label="Friendly" value="friendly" />
            <el-option label="Good with kids" value="good_with_kids" />
            <el-option label="Good with other pets" value="good_with_pets" />
            <el-option label="House trained" value="house_trained" />
            <el-option label="Special needs" value="special_needs" />
            <el-option label="Senior" value="senior" />
            <el-option label="Playful" value="playful" />
            <el-option label="Calm" value="calm" />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Location" prop="location">
              <el-input v-model="petForm.location" placeholder="City, State" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Status" prop="status">
              <el-select v-model="petForm.status" placeholder="Select status">
                <el-option label="Available" value="available" />
                <el-option label="Pending" value="pending" />
                <el-option label="Reserved" value="reserved" />
                <el-option label="Adopted" value="adopted" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Pet Image">
          <el-upload
            class="pet-image-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <el-button type="primary">Upload Image</el-button>
            <template #tip>
              <div class="el-upload__tip">Upload a clear photo of the pet</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showPetProfileDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleAddPet" :loading="addingPet">
          Add Pet
        </el-button>
      </template>
    </el-dialog>

    <!-- Adoption Inquiry Dialog -->
    <el-dialog v-model="showAdoptionInquiryDialog" title="New Adoption Inquiry" width="600px">
      <el-form :model="inquiryForm" :rules="inquiryRules" ref="inquiryFormRef" label-width="120px">
        <el-form-item label="Pet" prop="petId">
          <el-select v-model="inquiryForm.petId" placeholder="Select pet" filterable>
            <el-option
              v-for="pet in availablePets"
              :key="pet.id"
              :label="`${pet.name} (${pet.breed})`"
              :value="pet.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Your Name" prop="senderName">
          <el-input v-model="inquiryForm.senderName" placeholder="Enter your full name" />
        </el-form-item>
        
        <el-form-item label="Message" prop="message">
          <el-input
            v-model="inquiryForm.message"
            type="textarea"
            :rows="4"
            placeholder="Tell us about yourself and why you're interested in adopting this pet"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Phone" prop="phone">
              <el-input v-model="inquiryForm.phone" placeholder="Phone number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input v-model="inquiryForm.email" placeholder="Email address" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Location" prop="location">
          <el-input v-model="inquiryForm.location" placeholder="Your city and state" />
        </el-form-item>
        
        <el-form-item label="Urgency" prop="urgency">
          <el-select v-model="inquiryForm.urgency" placeholder="Select urgency level">
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAdoptionInquiryDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitInquiry" :loading="submittingInquiry">
          Submit Inquiry
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, ChatDotRound } from '@element-plus/icons-vue';

// Interfaces
interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  description: string;
  tags: string[];
  location: string;
  status: 'available' | 'pending' | 'reserved' | 'adopted';
  image?: string;
  createdAt: string;
}

interface AdoptionInquiry {
  id: string;
  petId: string;
  petName: string;
  petBreed: string;
  petImage?: string;
  senderName: string;
  message: string;
  phone: string;
  email: string;
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'declined' | 'more_info_requested';
  createdAt: string;
}

// Props and Emits
const emit = defineEmits<{
  petSelected: [pet: PetProfile];
  inquirySubmitted: [inquiry: AdoptionInquiry];
  adoptionApproved: [inquiry: AdoptionInquiry];
  adoptionDeclined: [inquiry: AdoptionInquiry];
}>();

// State
const availablePets = ref<PetProfile[]>([]);
const pendingAdoptions = ref<AdoptionInquiry[]>([]);
const successfulAdoptions = ref<AdoptionInquiry[]>([]);
const activeInquiries = ref<AdoptionInquiry[]>([]);

// Dialogs
const showPetProfileDialog = ref(false);
const showAdoptionInquiryDialog = ref(false);

// Form refs
const petFormRef = ref();
const inquiryFormRef = ref();

// Forms
const petForm = ref({
  name: '',
  species: '',
  breed: '',
  age: 1,
  description: '',
  tags: [],
  location: '',
  status: 'available' as const,
  image: ''
});

const inquiryForm = ref({
  petId: '',
  senderName: '',
  message: '',
  phone: '',
  email: '',
  location: '',
  urgency: 'medium' as const
});

// Form validation rules
const petRules = {
  name: [{ required: true, message: 'Please enter pet name', trigger: 'blur' }],
  species: [{ required: true, message: 'Please select species', trigger: 'change' }],
  breed: [{ required: true, message: 'Please enter breed', trigger: 'blur' }],
  age: [{ required: true, message: 'Please enter age', trigger: 'blur' }],
  description: [{ required: true, message: 'Please enter description', trigger: 'blur' }],
  tags: [{ required: true, message: 'Please select tags', trigger: 'change' }],
  location: [{ required: true, message: 'Please enter location', trigger: 'blur' }],
  status: [{ required: true, message: 'Please select status', trigger: 'change' }]
};

const inquiryRules = {
  petId: [{ required: true, message: 'Please select a pet', trigger: 'change' }],
  senderName: [{ required: true, message: 'Please enter your name', trigger: 'blur' }],
  message: [{ required: true, message: 'Please enter a message', trigger: 'blur' }],
  phone: [{ required: true, message: 'Please enter phone number', trigger: 'blur' }],
  email: [{ required: true, message: 'Please enter email address', trigger: 'blur' }],
  location: [{ required: true, message: 'Please enter your location', trigger: 'blur' }],
  urgency: [{ required: true, message: 'Please select urgency level', trigger: 'change' }]
};

// Loading states
const addingPet = ref(false);
const submittingInquiry = ref(false);

// Computed properties
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: 'success',
    pending: 'warning',
    reserved: 'info',
    adopted: 'danger'
  };
  return colors[status] || 'info';
};

const getUrgencyColor = (urgency: string): string => {
  const colors: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  };
  return colors[urgency] || 'info';
};

// Methods
const loadPetData = async () => {
  // This would load data from your backend
  // For now, using mock data
  availablePets.value = [
    {
      id: '1',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      description: 'Friendly and energetic Golden Retriever looking for an active family.',
      tags: ['friendly', 'good_with_kids', 'playful'],
      location: 'New York, NY',
      status: 'available',
      image: '/public/assets/p1.png',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Luna',
      species: 'cat',
      breed: 'Domestic Shorthair',
      age: 2,
      description: 'Sweet and gentle cat who loves to cuddle and play with toys.',
      tags: ['calm', 'good_with_pets', 'house_trained'],
      location: 'Los Angeles, CA',
      status: 'available',
      image: '/public/assets/p2.png',
      createdAt: new Date().toISOString()
    }
  ];

  activeInquiries.value = [
    {
      id: '1',
      petId: '1',
      petName: 'Buddy',
      petBreed: 'Golden Retriever',
      petImage: '/public/assets/p1.png',
      senderName: 'John Smith',
      message: 'I have a large backyard and love to go hiking. I think Buddy would be perfect for our family!',
      phone: '555-123-4567',
      email: 'john@example.com',
      location: 'New York, NY',
      urgency: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ];
};

const handleImageChange = (file: any) => {
  // Handle image upload
  petForm.value.image = URL.createObjectURL(file.raw);
};

const handleAddPet = async () => {
  if (!petFormRef.value) return;
  
  try {
    await petFormRef.value.validate();
    addingPet.value = true;
    
    // This would send to your backend
    const newPet: PetProfile = {
      id: Date.now().toString(),
      ...petForm.value,
      createdAt: new Date().toISOString()
    };
    
    availablePets.value.push(newPet);
    ElMessage.success('Pet profile added successfully!');
    showPetProfileDialog.value = false;
    
    // Reset form
    petForm.value = {
      name: '',
      species: '',
      breed: '',
      age: 1,
      description: '',
      tags: [],
      location: '',
      status: 'available',
      image: ''
    };
  } catch (error) {
    console.error('Error adding pet:', error);
  } finally {
    addingPet.value = false;
  }
};

const handleSubmitInquiry = async () => {
  if (!inquiryFormRef.value) return;
  
  try {
    await inquiryFormRef.value.validate();
    submittingInquiry.value = true;
    
    const selectedPet = availablePets.value.find(p => p.id === inquiryForm.value.petId);
    if (!selectedPet) {
      ElMessage.error('Pet not found');
      return;
    }
    
    const newInquiry: AdoptionInquiry = {
      id: Date.now().toString(),
      petId: inquiryForm.value.petId,
      petName: selectedPet.name,
      petBreed: selectedPet.breed,
      petImage: selectedPet.image,
      senderName: inquiryForm.value.senderName,
      message: inquiryForm.value.message,
      phone: inquiryForm.value.phone,
      email: inquiryForm.value.email,
      location: inquiryForm.value.location,
      urgency: inquiryForm.value.urgency,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    activeInquiries.value.push(newInquiry);
    ElMessage.success('Adoption inquiry submitted successfully!');
    showAdoptionInquiryDialog.value = false;
    emit('inquirySubmitted', newInquiry);
    
    // Reset form
    inquiryForm.value = {
      petId: '',
      senderName: '',
      message: '',
      phone: '',
      email: '',
      location: '',
      urgency: 'medium'
    };
  } catch (error) {
    console.error('Error submitting inquiry:', error);
  } finally {
    submittingInquiry.value = false;
  }
};

const viewPetProfile = (pet: PetProfile) => {
  emit('petSelected', pet);
};

const viewPetDetails = (pet: PetProfile) => {
  emit('petSelected', pet);
};

const startAdoptionInquiry = (pet: PetProfile) => {
  inquiryForm.value.petId = pet.id;
  showAdoptionInquiryDialog.value = true;
};

const approveAdoption = (inquiry: AdoptionInquiry) => {
  inquiry.status = 'approved';
  ElMessage.success('Adoption approved!');
  emit('adoptionApproved', inquiry);
};

const declineAdoption = (inquiry: AdoptionInquiry) => {
  inquiry.status = 'declined';
  ElMessage.info('Adoption declined');
  emit('adoptionDeclined', inquiry);
};

const requestMoreInfo = (inquiry: AdoptionInquiry) => {
  inquiry.status = 'more_info_requested';
  ElMessage.info('More information requested');
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Lifecycle
onMounted(() => {
  loadPetData();
});
</script>

<style scoped lang="scss">
.pet-adoption-chat {
  padding: 20px;
  
  .chat-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        h2 {
          margin: 0 0 8px 0;
          color: #2c3e50;
        }
        
        .subtitle {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
        }
      }
      
      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
    
    .quick-stats {
      margin-top: 20px;
      
      .stat-card {
        display: flex;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: white;
        
        .stat-icon {
          font-size: 32px;
          margin-right: 15px;
        }
        
        .stat-content {
          h3 {
            margin: 0 0 5px 0;
            font-size: 24px;
            font-weight: bold;
          }
          
          p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
          }
        }
      }
    }
  }
  
  .pet-profiles {
    margin-bottom: 20px;
    
    .pet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      
      .pet-card {
        border: 1px solid #e9ecef;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
        
        &:hover {
          border-color: #4a90e2;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
          transform: translateY(-2px);
        }
        
        .pet-image {
          position: relative;
          height: 200px;
          
          .el-image {
            width: 100%;
            height: 100%;
          }
          
          .pet-status {
            position: absolute;
            top: 10px;
            right: 10px;
          }
        }
        
        .pet-info {
          padding: 15px;
          
          h4 {
            margin: 0 0 8px 0;
            color: #2c3e50;
            font-size: 18px;
          }
          
          .pet-breed {
            margin: 0 0 5px 0;
            color: #4a90e2;
            font-weight: 600;
          }
          
          .pet-age,
          .pet-location {
            margin: 0 0 5px 0;
            color: #7f8c8d;
            font-size: 14px;
          }
          
          .pet-tags {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            
            .tag {
              margin: 0;
            }
          }
        }
        
        .pet-actions {
          padding: 15px;
          display: flex;
          gap: 8px;
          justify-content: center;
          border-top: 1px solid #e9ecef;
        }
      }
    }
  }
  
  .adoption-inquiries {
    .inquiries-list {
      .inquiry-item {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #4a90e2;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
        }
        
        &.urgent {
          border-color: #f56c6c;
          background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%);
        }
        
        .inquiry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          
          .inquiry-pet {
            display: flex;
            align-items: center;
            gap: 15px;
            
            .pet-details {
              h4 {
                margin: 0 0 5px 0;
                color: #2c3e50;
              }
              
              p {
                margin: 0;
                color: #7f8c8d;
                font-size: 14px;
              }
            }
          }
          
          .inquiry-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
            
            .inquiry-date {
              color: #7f8c8d;
              font-size: 12px;
            }
          }
        }
        
        .inquiry-content {
          margin-bottom: 15px;
          
          .inquiry-message {
            margin: 0 0 10px 0;
            color: #2c3e50;
            line-height: 1.5;
          }
          
          .inquiry-details {
            display: flex;
            gap: 20px;
            color: #7f8c8d;
            font-size: 14px;
            
            span {
              display: flex;
              align-items: center;
              gap: 5px;
            }
          }
        }
        
        .inquiry-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
      }
    }
  }
}

.pet-image-upload {
  .el-upload__tip {
    color: #7f8c8d;
    font-size: 12px;
    margin-top: 5px;
  }
}
</style>
