// Field selection constants for user queries

export const PUBLIC_FIELDS =
  'name email phone role avatar bio location preferences favoritePets viewedPets adoptionHistory reviewHistory isActive emailVerified lastLogin createdAt updatedAt';

export const ADMIN_FIELDS =
  'name email phone role avatar bio location preferences isActive emailVerified lastLogin createdAt updatedAt warnings contentRemovals isBanned banExpiry banReason bannedBy bannedAt deletedAt deletedBy deletionReason';

export const SHELTER_FIELDS =
  'name email phone role avatar bio location address city state zipCode country description website socialMedia profileViews pets adoptionRequests reviews isActive emailVerified lastLogin createdAt updatedAt';
