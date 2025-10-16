/**
 * Contract Template Service
 * Generates English adoption contracts
 */

import { format } from 'date-fns';
import crypto from 'crypto';

/**
 * Build adoption contract template
 * @param {Object} args - Contract generation arguments
 * @param {string} [args.title] - Custom contract title
 * @param {string} [args.description] - Custom contract description
 * @param {string} [args.extraTerms] - Additional custom terms
 * @param {Object} args.adoption - Populated adoption document
 * @returns {Object} Contract data with content, title, description, etc.
 */
export function buildAdoptionContract(args) {
  const { adoption } = args;

  // Debug logging to see what data we're getting
  console.log('🔍 Contract Template - Adoption data:', {
    hasAdoption: !!adoption,
    hasUser: !!adoption?.user,
    hasShelter: !!adoption?.shelter,
    hasPet: !!adoption?.pet,
    userData: adoption?.user,
    shelterData: adoption?.shelter,
    petData: adoption?.pet,
  });

  // More detailed logging for each field
  console.log('🔍 User fields:', {
    name: adoption?.user?.name,
    email: adoption?.user?.email,
    phone: adoption?.user?.phone,
    firstName: adoption?.user?.firstName,
    lastName: adoption?.user?.lastName,
    location: adoption?.user?.location,
  });

  console.log('🔍 Shelter fields:', {
    name: adoption?.shelter?.name,
    email: adoption?.shelter?.email,
    phone: adoption?.shelter?.phone,
    location: adoption?.shelter?.location,
  });

  console.log('🔍 Pet fields:', {
    name: adoption?.pet?.name,
    type: adoption?.pet?.type,
    breed: adoption?.pet?.breed,
    age: adoption?.pet?.age,
    gender: adoption?.pet?.gender,
  });

  // Access the actual data from the populated objects
  // Try to get the data from the debug logs we can see
  const u = adoption.user || {};
  const s = adoption.shelter || {};
  const p = adoption.pet || {};

  // If the data is not accessible directly, try to get it from the debug logs structure
  if (!u.name && adoption.user) {
    console.log('🔍 Trying alternative access for user data');
    // The data might be in a different structure
    const userData = adoption.user;
    u.name = userData.name || userData._doc?.name;
    u.email = userData.email || userData._doc?.email;
    u.phone = userData.phone || userData._doc?.phone;
    u.location = userData.location || userData._doc?.location;
  }

  if (!s.name && adoption.shelter) {
    console.log('🔍 Trying alternative access for shelter data');
    const shelterData = adoption.shelter;
    s.name = shelterData.name || shelterData._doc?.name;
    s.email = shelterData.email || shelterData._doc?.email;
    s.phone = shelterData.phone || shelterData._doc?.phone;
    s.location = shelterData.location || shelterData._doc?.location;
  }

  console.log('🔍 Extracted user data:', {
    name: u.name,
    email: u.email,
    phone: u.phone,
    location: u.location,
  });

  console.log('🔍 Extracted shelter data:', {
    name: s.name,
    email: s.email,
    phone: s.phone,
    location: s.location,
  });

  // Debug: Check if the data is actually there
  console.log('🔍 Raw user object keys:', Object.keys(u));
  console.log('🔍 Raw shelter object keys:', Object.keys(s));
  console.log('🔍 Raw pet object keys:', Object.keys(p));
  const today = new Date();

  // Contract title and description
  const title = args.title?.trim() || 'PET ADOPTION AGREEMENT';

  const description =
    args.description?.trim() || 'Agreement between Adopter and Shelter/Rescue.';

  // Helper to join non-empty lines
  const lines = (arr) => arr.filter(Boolean).join('\n');

  // Get user address from location or direct address field
  const userAddress = u?.location?.details?.street
    ? formatAddress(u.location)
    : u?.address || '';

  const shelterAddress = s?.location?.details?.street
    ? formatAddress(s.location)
    : s?.address || '';

  // Contract header with parties information
  const header = lines([
    `# ${title}`,
    `_Signing date: ${format(today, 'dd/MM/yyyy')}_`,
    '',
    `**ADOPTER**`,
    `- Full name: ${u.name || u.firstName || 'N/A'}`,
    `- Email: ${u.email || 'N/A'}`,
    `- Phone: ${u.phone || 'N/A'}`,
    `- Address: ${userAddress || 'N/A'}`,
    '',
    `**SHELTER/RESCUE**`,
    `- Organization: ${s.name || 'N/A'}`,
    `- Representative: ${s.representative || s.name || 'N/A'}`,
    `- Email: ${s.email || 'N/A'}`,
    `- Phone: ${s.phone || 'N/A'}`,
    `- Address: ${shelterAddress || 'N/A'}`,
    '',
    `**PET**`,
    `- Name: ${p.name || 'N/A'}`,
    `- Species: ${p.type || 'N/A'}; Breed: ${p.breed || 'N/A'}`,
    `- Gender: ${p.gender || 'N/A'}; Age: ${p.age || 'N/A'}`,
    p.microchipId ? `- Microchip: ${p.microchipId}` : '',
    '---',
    description ? `> ${description}` : '',
  ]);

  // Standard contract terms
  const standardTerms = `## I. Adopter's Commitments
1. Provide safe housing, food/water, and necessary veterinary care.
2. No sale, gift, or transfer to third parties without Shelter's written consent.
3. Pet **must** be neutered/spayed (if not yet) per veterinarian's schedule; costs borne by Adopter unless otherwise agreed.
4. Adopter agrees to post-adoption checks (online/on-site) within 30–90 days.
5. Shelter may reclaim the pet if living conditions are considered unsuitable.

## II. Financial Responsibility
- Adoption fee (if any): ______
- Vaccination/spay/microchip costs (if any): ______
- Others: ______

## III. Health & Records
- Medical records provided: Vaccination book/exam slips/photos (if any).
- Shelter disclaims latent conditions not apparent at handover.

## IV. Return Policy
- Within 14 days upon serious issues, Adopter **must** notify Shelter and prioritize returning the pet.

## V. Handover
- Method: In person / Delivery / Other
- Location (planned): ______
- Time: ______

## VI. Governing Law
- This contract is governed by the laws of the jurisdiction where the shelter is located.
- Any disputes arising from this contract shall be resolved through local courts or arbitration.
- The contract language is English, and in case of translation disputes, the English version shall prevail.

## VII. General Terms
- Disputes handled by good-faith negotiation prior to legal action.
- Effective from the signing date.`;

  // Signatures section
  const signatures = `---
## VIII. Signatures
- **Adopter (Signature & Name)**: __________ Date: ____/____/____
- **Shelter (Signature & Name)**: __________ Date: ____/____/____
`;

  // Additional terms section
  const extra = args.extraTerms?.trim()
    ? `\n---\n## Additional Terms\n${args.extraTerms}\n`
    : '';

  // Combine all sections
  const content = [header, standardTerms, extra, signatures].join('\n\n');

  // Generate checksum for content auditing
  const checksum = crypto.createHash('sha256').update(content).digest('hex');

  return {
    version: (adoption.contractDetails?.version ?? 0) + 1,
    title,
    description,
    extraTerms: args.extraTerms || '',
    content,
    language: 'en',
    contractId: `ADOPT-${adoption._id.toString().slice(-8).toUpperCase()}`,
    generatedAt: new Date(),
    checksum,
  };
}

/**
 * Format address object to string
 * @param {Object} addr - Address object with nested structure
 * @returns {string} Formatted address string
 */
function formatAddress(addr) {
  // addr = { details: { street }, ward: { name }, district: { name }, province: { name }, postalCode }
  const parts = [
    addr?.details?.street,
    addr?.ward?.name,
    addr?.district?.name,
    addr?.province?.name,
    addr?.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Get available contract languages
 * @returns {Array} Array of language options
 */
export function getAvailableLanguages() {
  return [{ value: 'en', label: 'English', flag: '🇺🇸' }];
}

/**
 * Get contract template information
 * @returns {Object} Template information
 */
export function getContractTemplateInfo() {
  return {
    title: 'Pet Adoption Agreement',
    description: 'Official adoption agreement between shelter and adopter',
    version: '1.0',
  };
}

/**
 * Validate contract generation options
 * @param {Object} options - Contract generation options
 * @returns {Object} Validation result
 */
export function validateContractOptions(options) {
  const errors = [];

  if (options.language && options.language !== 'en') {
    errors.push('Only English language is supported');
  }

  if (options.version && typeof options.version !== 'string') {
    errors.push('Version must be a string');
  }

  if (
    options.generatePdf !== undefined &&
    typeof options.generatePdf !== 'boolean'
  ) {
    errors.push('generatePdf must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
