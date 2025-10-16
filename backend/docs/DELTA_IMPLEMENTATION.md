# Backend Enhancement for Delta Values

## Overview

To support the "Soulful" KPI cards with delta indicators, the backend needs to calculate percentage changes from the previous period for each metric.

## Implementation Example

### 1. Enhanced System Stats Service

```javascript
// backend/src/modules/admin/services/system.service.admin.js

export const adminSystemService = {
  /**
   * Get system stats with delta calculations
   */
  getStats: async (period = '30d') => {
    try {
      // Calculate date range for current period
      const now = new Date();
      const currentPeriodStart = getPeriodStart(now, period);
      const previousPeriodStart = getPeriodStart(
        currentPeriodStart,
        period,
        true
      );

      // Current period counts
      const currentStats = await getCurrentPeriodStats(currentPeriodStart, now);

      // Previous period counts
      const previousStats = await getPreviousPeriodStats(
        previousPeriodStart,
        currentPeriodStart
      );

      // Calculate deltas
      const deltas = calculateDeltas(currentStats, previousStats);

      return {
        // Current values
        ...currentStats,
        // Delta values (% change from previous period)
        ...deltas,
        // Additional data...
        recentUsers: currentStats.recentUsers,
        recentShelters: currentStats.recentShelters,
        adoptionStats: currentStats.adoptionStats,
        reviewStats: currentStats.reviewStats,
      };
    } catch (error) {
      logger.error('Get system stats service error:', error);
      throw error;
    }
  },
};

// Helper functions
const getPeriodStart = (date, period, isPrevious = false) => {
  const start = new Date(date);
  const multiplier = isPrevious ? -2 : -1;

  switch (period) {
    case '7d':
      start.setDate(start.getDate() + 7 * multiplier);
      break;
    case '30d':
      start.setDate(start.getDate() + 30 * multiplier);
      break;
    case '90d':
      start.setDate(start.getDate() + 90 * multiplier);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() + multiplier);
      break;
    default:
      start.setDate(start.getDate() + 30 * multiplier);
  }
  return start;
};

const getCurrentPeriodStats = async (start, end) => {
  const [
    totalUsers,
    totalShelters,
    totalPets,
    totalAdoptions,
    totalReviews,
    pendingShelters,
    pendingPets,
    recentUsers,
    recentShelters,
    adoptionStats,
    reviewStats,
  ] = await Promise.all([
    User.countDocuments({
      role: 'user',
      createdAt: { $gte: start, $lte: end },
    }),
    Shelter.countDocuments({
      createdAt: { $gte: start, $lte: end },
    }),
    Pet.countDocuments({
      createdAt: { $gte: start, $lte: end },
    }),
    AdoptionRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
    }),
    Review.countDocuments({
      createdAt: { $gte: start, $lte: end },
    }),
    Shelter.countDocuments({
      isApproved: false,
      createdAt: { $gte: start, $lte: end },
    }),
    Pet.countDocuments({
      status: 'pending',
      createdAt: { $gte: start, $lte: end },
    }),
    // ... other queries
  ]);

  return {
    totalUsers,
    totalShelters,
    totalPets,
    totalAdoptions,
    totalReviews,
    pendingShelters,
    pendingPets,
    recentUsers,
    recentShelters,
    adoptionStats,
    reviewStats,
  };
};

const getPreviousPeriodStats = async (start, end) => {
  // Similar to getCurrentPeriodStats but for previous period
  const [
    totalUsers,
    totalShelters,
    totalPets,
    totalAdoptions,
    totalReviews,
    pendingShelters,
    pendingPets,
  ] = await Promise.all([
    User.countDocuments({
      role: 'user',
      createdAt: { $gte: start, $lt: end },
    }),
    Shelter.countDocuments({
      createdAt: { $gte: start, $lt: end },
    }),
    Pet.countDocuments({
      createdAt: { $gte: start, $lt: end },
    }),
    AdoptionRequest.countDocuments({
      createdAt: { $gte: start, $lt: end },
    }),
    Review.countDocuments({
      createdAt: { $gte: start, $lt: end },
    }),
    Shelter.countDocuments({
      isApproved: false,
      createdAt: { $gte: start, $lt: end },
    }),
    Pet.countDocuments({
      status: 'pending',
      createdAt: { $gte: start, $lt: end },
    }),
  ]);

  return {
    totalUsers,
    totalShelters,
    totalPets,
    totalAdoptions,
    totalReviews,
    pendingShelters,
    pendingPets,
  };
};

const calculateDeltas = (current, previous) => {
  const calculateDelta = (currentVal, previousVal) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  return {
    totalUsersDelta: calculateDelta(current.totalUsers, previous.totalUsers),
    totalSheltersDelta: calculateDelta(
      current.totalShelters,
      previous.totalShelters
    ),
    totalPetsDelta: calculateDelta(current.totalPets, previous.totalPets),
    totalAdoptionsDelta: calculateDelta(
      current.totalAdoptions,
      previous.totalAdoptions
    ),
    totalReviewsDelta: calculateDelta(
      current.totalReviews,
      previous.totalReviews
    ),
    pendingSheltersDelta: calculateDelta(
      current.pendingShelters,
      previous.pendingShelters
    ),
    pendingPetsDelta: calculateDelta(current.pendingPets, previous.pendingPets),
  };
};
```

### 2. Enhanced Controller

```javascript
// backend/src/modules/admin/controllers/admin.logs.controller.js

export const AdminGetSystemStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const stats = await adminSystemService.getStats(period);

  // Log admin action
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed system statistics',
    { stats, period },
    'System monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'System stats retrieved successfully',
    stats
  );
});
```

### 3. Frontend Integration

The frontend is already set up to handle delta values. When the backend provides delta fields like `totalUsersDelta`, `totalSheltersDelta`, etc., they will automatically appear as trend indicators in the KPI cards.

### 4. Alternative: Frontend Calculation

If you prefer to calculate deltas on the frontend, you can:

1. Store previous period data in localStorage or state
2. Calculate deltas when new data arrives
3. Use the same DeltaBadge component

```typescript
// Frontend calculation example
const calculateDeltas = (current: SystemStats, previous: SystemStats) => {
  const delta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalUsersDelta: delta(current.totalUsers, previous.totalUsers),
    totalSheltersDelta: delta(current.totalShelters, previous.totalShelters),
    // ... etc
  };
};
```

## Benefits

- **Quick Visual Assessment**: Admins can instantly see if metrics are trending up or down
- **Period Comparison**: Compare current period vs previous period performance
- **Color-coded Indicators**: Green for positive trends, red for negative, gray for neutral
- **Accessibility**: Tooltips provide detailed information about changes
- **Flexible Periods**: Support for 7d, 30d, 90d, 1y comparisons

## Usage

Once implemented, the KPI cards will automatically show delta indicators when delta values are provided by the backend. The indicators will appear next to the metric labels with appropriate colors and trend arrows.
