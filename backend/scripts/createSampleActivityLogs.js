import mongoose from 'mongoose';
import ActivityLog from '../src/modules/activity/activity.model.js';
import config from '../src/config/index.js';

// Connect to MongoDB
mongoose.connect(config.mongoUri);

const createSampleActivityLogs = async () => {
  try {
    console.log('Creating sample activity logs...');

    // Sample activity logs data
    const sampleLogs = [
      {
        action: 'user_registered',
        category: 'user',
        severity: 'low',
        description: 'New user John Doe registered',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user',
        },
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/auth/register',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        action: 'pet_created',
        category: 'pet',
        severity: 'high',
        description: 'Buddy was added to the system',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          role: 'shelter',
        },
        shelter: new mongoose.Types.ObjectId(),
        metadata: {
          petId: new mongoose.Types.ObjectId(),
          petName: 'Buddy',
          ipAddress: '192.168.1.101',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/pets',
        },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        action: 'adoption_request_created',
        category: 'adoption',
        severity: 'medium',
        description: 'Adoption request created for Buddy by John Doe',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user',
        },
        shelter: new mongoose.Types.ObjectId(),
        metadata: {
          adoptionId: new mongoose.Types.ObjectId(),
          petId: new mongoose.Types.ObjectId(),
          ipAddress: '192.168.1.100',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/adoption',
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        action: 'login',
        category: 'system',
        severity: 'low',
        description: 'User Sarah Wilson logged in',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          role: 'shelter',
        },
        shelter: new mongoose.Types.ObjectId(),
        metadata: {
          ipAddress: '192.168.1.101',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/auth/login',
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        action: 'admin_action',
        category: 'admin',
        severity: 'critical',
        description: 'Admin performed system maintenance',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/admin/maintenance',
          additionalData: {
            maintenanceType: 'database_cleanup',
            duration: '30 minutes',
          },
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        action: 'file_uploaded',
        category: 'file',
        severity: 'medium',
        description: 'File "pet_photo_1.jpg" was uploaded',
        performedBy: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          role: 'shelter',
        },
        shelter: new mongoose.Types.ObjectId(),
        metadata: {
          fileName: 'pet_photo_1.jpg',
          fileSize: 2048576,
          fileType: 'image/jpeg',
          fileUrl: 'https://example.com/uploads/pet_photo_1.jpg',
          ipAddress: '192.168.1.101',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/upload',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
    ];

    // Insert sample logs
    const createdLogs = await ActivityLog.insertMany(sampleLogs);
    console.log(`✅ Created ${createdLogs.length} sample activity logs`);

    // Display summary
    console.log('\n📊 Sample Activity Logs Created:');
    createdLogs.forEach((log, index) => {
      console.log(
        `${index + 1}. ${log.action} - ${log.description} (${log.severity})`
      );
    });

    console.log('\n🎉 Sample activity logs created successfully!');
    console.log(
      'You can now view them in the admin dashboard at http://localhost:5173/admin/dashboard?tab=logs'
    );
  } catch (error) {
    console.error('❌ Error creating sample activity logs:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
createSampleActivityLogs();
