const mongoose = require('mongoose');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/pawfectfriends'
    );
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample report data
const sampleReports = [
  {
    reason: 'spam',
    description:
      'This user has been sending multiple unsolicited messages about cryptocurrency investments. They keep messaging me despite me asking them to stop.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/screenshot1.png',
        description: 'Screenshot of spam messages',
      },
      {
        type: 'text',
        content: 'Multiple messages about Bitcoin investment opportunities',
        description: 'Copy of spam messages',
      },
    ],
    status: 'pending',
  },
  {
    reason: 'fraud',
    description:
      'This shelter is asking for upfront payment before allowing me to see the pet. They refuse to provide proper documentation and seem suspicious.',
    evidence: [
      {
        type: 'link',
        content: 'https://example.com/suspicious-profile',
        description: 'Link to suspicious shelter profile',
      },
      {
        type: 'text',
        content: 'Conversation where they asked for $200 upfront payment',
        description: 'Payment request evidence',
      },
    ],
    status: 'investigating',
  },
  {
    reason: 'harassment',
    description:
      'This user has been sending threatening messages and inappropriate photos after I declined their adoption request.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/threats.png',
        description: 'Screenshot of threatening messages',
      },
    ],
    status: 'resolved',
    adminNotes: 'User has been temporarily banned for 30 days. Warning issued.',
    adminAction: 'temporary_ban',
    actionDetails: {
      banDuration: 30,
      banReason: 'Harassment and inappropriate behavior',
      warningMessage:
        'Please respect other users and follow community guidelines.',
    },
  },
  {
    reason: 'inappropriate_content',
    description:
      'This user posted inappropriate photos of pets in distress. The content is disturbing and violates community standards.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/inappropriate.png',
        description: 'Screenshot of inappropriate content',
      },
    ],
    status: 'dismissed',
    adminNotes:
      'Content reviewed and found to be educational about pet care. No violation.',
    adminAction: 'none',
  },
  {
    reason: 'fake_profile',
    description:
      'This shelter profile appears to be fake. The photos are stock images and the contact information is invalid.',
    evidence: [
      {
        type: 'link',
        content: 'https://example.com/stock-photos',
        description: 'Link to stock photo source',
      },
      {
        type: 'text',
        content: 'Phone number is disconnected, email bounces back',
        description: 'Contact verification failure',
      },
    ],
    status: 'resolved',
    adminNotes: 'Profile verified as fake. Account suspended.',
    adminAction: 'permanent_ban',
    actionDetails: {
      banReason: 'Fake profile with misleading information',
    },
  },
  {
    reason: 'scam',
    description:
      'This user is running a pet adoption scam. They ask for money upfront but never deliver the pet.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/scam-proof.png',
        description: 'Screenshot of scam conversation',
      },
      {
        type: 'text',
        content: 'Multiple victims reported similar experiences',
        description: 'Pattern of fraudulent behavior',
      },
    ],
    status: 'investigating',
  },
  {
    reason: 'violation_of_terms',
    description:
      'This user is using the platform to sell pets for profit, which violates our terms of service.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/selling-pets.png',
        description: 'Screenshot of pet selling posts',
      },
    ],
    status: 'pending',
  },
  {
    reason: 'other',
    description:
      'This user has been impersonating a veterinarian and giving medical advice without proper credentials.',
    evidence: [
      {
        type: 'text',
        content: 'Claims to be Dr. Smith from ABC Veterinary Clinic',
        description: 'False credentials claim',
      },
      {
        type: 'link',
        content: 'https://example.com/fake-clinic',
        description: 'Link to non-existent clinic',
      },
    ],
    status: 'resolved',
    adminNotes:
      'User warned about impersonation. Profile updated to remove false credentials.',
    adminAction: 'warning',
    actionDetails: {
      warningMessage:
        'Please do not impersonate medical professionals. Only provide general pet care advice.',
    },
  },
  {
    reason: 'spam',
    description:
      'This user keeps posting the same pet listing multiple times per day, flooding the feed.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/spam-posts.png',
        description: 'Screenshot showing repeated posts',
      },
    ],
    status: 'pending',
  },
  {
    reason: 'harassment',
    description:
      'This user has been stalking my profile and sending creepy messages about my pets.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/stalking.png',
        description: 'Screenshot of stalking messages',
      },
    ],
    status: 'investigating',
  },
  {
    reason: 'fraud',
    description:
      "This shelter is using photos of pets that don't exist or belong to other shelters.",
    evidence: [
      {
        type: 'link',
        content: 'https://example.com/original-photos',
        description: 'Link to original photo source',
      },
      {
        type: 'text',
        content: 'Reverse image search shows photos from different shelter',
        description: 'Photo verification evidence',
      },
    ],
    status: 'resolved',
    adminNotes:
      'Shelter warned about using unauthorized photos. Photos removed.',
    adminAction: 'warning',
    actionDetails: {
      warningMessage:
        'Please only use photos of pets that are actually available for adoption at your shelter.',
    },
  },
  {
    reason: 'inappropriate_content',
    description:
      'This user posted graphic content showing animal abuse. This is completely unacceptable.',
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/abuse-content.png',
        description: 'Screenshot of inappropriate content (blurred)',
      },
    ],
    status: 'resolved',
    adminNotes: 'Content removed immediately. User permanently banned.',
    adminAction: 'permanent_ban',
    actionDetails: {
      banReason: 'Posting graphic animal abuse content',
    },
  },
  {
    reason: 'scam',
    description:
      'This user is pretending to be a pet rescue organization but is actually selling pets illegally.',
    evidence: [
      {
        type: 'text',
        content:
          'No rescue license, asking for "donations" that are actually payments',
        description: 'Evidence of illegal pet selling',
      },
    ],
    status: 'investigating',
  },
  {
    reason: 'violation_of_terms',
    description:
      'This user is using automated tools to spam the platform with fake adoption requests.',
    evidence: [
      {
        type: 'text',
        content: 'Multiple identical adoption requests from different accounts',
        description: 'Evidence of automated spam',
      },
    ],
    status: 'pending',
  },
  {
    reason: 'fake_profile',
    description:
      "This user created multiple fake profiles to boost their shelter's reputation.",
    evidence: [
      {
        type: 'screenshot',
        content: 'https://example.com/fake-profiles.png',
        description: 'Screenshot showing multiple fake profiles',
      },
    ],
    status: 'resolved',
    adminNotes: 'Fake profiles removed. Main account warned.',
    adminAction: 'warning',
    actionDetails: {
      warningMessage:
        'Creating fake profiles violates our terms. Please use only one account.',
    },
  },
];

// Function to get random users from database
const getRandomUsers = async () => {
  try {
    // Import models dynamically
    const { Report } = require('../src/modules/report/report.model.js');
    const { User } = require('../src/modules/user/user.model.js');

    const users = await User.find({ role: { $in: ['user', 'shelter'] } }).limit(
      20
    );
    if (users.length < 2) {
      console.log(
        '⚠️ Not enough users in database. Need at least 2 users to create reports.'
      );
      return null;
    }
    return { users, Report, User };
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return null;
  }
};

// Function to create sample reports
const createSampleReports = async () => {
  try {
    console.log('🔄 Fetching users from database...');
    const result = await getRandomUsers();

    if (!result) {
      console.log(
        '❌ Cannot create reports without users. Please ensure you have users in the database.'
      );
      return;
    }

    const { users, Report, User } = result;
    console.log(`✅ Found ${users.length} users`);

    // Clear existing reports
    console.log('🔄 Clearing existing reports...');
    await Report.deleteMany({});
    console.log('✅ Existing reports cleared');

    // Create new reports
    console.log('🔄 Creating sample reports...');
    const reports = [];

    for (let i = 0; i < sampleReports.length; i++) {
      const reportData = sampleReports[i];

      // Get random reporter and reported user (make sure they're different)
      let reporter, reportedUser;
      do {
        reporter = users[Math.floor(Math.random() * users.length)];
        reportedUser = users[Math.floor(Math.random() * users.length)];
      } while (reporter._id.toString() === reportedUser._id.toString());

      const report = new Report({
        ...reportData,
        reporter: reporter._id,
        reportedUser: reportedUser._id,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
        updatedAt: new Date(),
      });

      reports.push(report);
    }

    await Report.insertMany(reports);
    console.log(`✅ Created ${reports.length} sample reports`);

    // Display summary
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 Report Statistics:');
    stats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} reports`);
    });

    const reasonStats = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📋 Reports by Reason:');
    reasonStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} reports`);
    });
  } catch (error) {
    console.error('❌ Error creating sample reports:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createSampleReports();
    console.log('\n✅ Sample reports created successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
main();
