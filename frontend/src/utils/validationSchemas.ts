import { z } from 'zod';
import { PASSWORD_REGEX } from '../constants/regex';

// Common validation schemas
export const commonSchemas = {
    email: z.string().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(
            PASSWORD_REGEX,
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    phone: z
        .string()
        .regex(/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number'),
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name cannot exceed 50 characters'),
    url: z.string().url('Please enter a valid URL'),
    zipCode: z
        .string()
        .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    required: z.string().min(1, 'This field is required'),
};

// Form validation helper
export const validateFormWithZod = <T extends z.ZodType>(
    schema: T,
    data: unknown
): { isValid: boolean; errors: Record<string, string> } => {
    try {
        schema.parse(data);
        return { isValid: true, errors: {} };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return { isValid: false, errors };
        }
        return { isValid: false, errors: { _form: 'Invalid form data' } };
    }
};

// Async form validation helper
export const validateFormAsync = async <T extends z.ZodType>(
    schema: T,
    data: unknown
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
    try {
        await schema.parseAsync(data);
        return { isValid: true, errors: {} };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return { isValid: false, errors };
        }
        return { isValid: false, errors: { _form: 'Invalid form data' } };
    }
};

// User registration schema
export const registerSchema = z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: commonSchemas.password,
    name: commonSchemas.name,
    phone: commonSchemas.phone,
    role: z.enum(['user', 'shelter']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Shelter registration schema
export const shelterRegisterSchema = z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: commonSchemas.password,
    name: commonSchemas.name,
    phone: commonSchemas.phone,
    role: z.enum(['user', 'shelter']),
    description: z.string().max(1000).optional(),
    website: commonSchemas.url.optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
});

// Pet creation schema
export const petSchema = z.object({
    name: commonSchemas.name,
    type: z.enum([
        'Dog',
        'Cat',
        'Bird',
        'Rabbit',
        'Small & Furry',
        'Horse',
        'Barnyard',
        'Scales, Fins & Other',
        'Other',
    ]),
    species: z.string().min(1, 'Species is required'),
    breeds: z.object({
        primary: z.string().min(1, 'Primary breed is required'),
        secondary: z.string().optional(),
        mixed: z.boolean().default(false),
        unknown: z.boolean().default(false),
    }),
    colors: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        tertiary: z.string().optional(),
    }),
    age: z.enum(['Baby', 'Young', 'Adult', 'Senior']),
    gender: z.enum(['Male', 'Female']),
    size: z.enum(['Small', 'Medium', 'Large', 'Extra Large']),
    weight: z.number().min(0).max(200),
    description: z.string().max(1000),
    photos: z.array(commonSchemas.url),
    adoptionFee: z.number().min(0),
    medicalInfo: z.object({
        spayedNeutered: z.boolean(),
        vaccinated: z.boolean(),
        microchipped: z.boolean(),
        specialNeeds: z.boolean(),
        medicalNotes: z.string().optional(),
    }),
    behavior: z.object({
        goodWithChildren: z.boolean(),
        goodWithDogs: z.boolean(),
        goodWithCats: z.boolean(),
        houseTrained: z.boolean(),
        crateTrained: z.boolean(),
        leashTrained: z.boolean(),
        behaviorNotes: z.string().optional(),
    }),
});

// Adoption application schema
export const adoptionSchema = z.object({
    housingType: z.enum(['house', 'apartment', 'condo', 'other']),
    hasYard: z.boolean(),
    yardDetails: z
        .object({
            isFenced: z.boolean(),
            size: z.string(),
        })
        .optional(),
    hasOtherPets: z.boolean(),
    otherPetsDetails: z
        .array(
            z.object({
                type: z.string(),
                species: z.string(),
                age: z.number(),
                description: z.string(),
            })
        )
        .optional(),
    hasChildren: z.boolean(),
    childrenAges: z.array(z.number()).optional(),
    workSchedule: z.string(),
    experience: z.string().optional(),
    reasonForAdopting: z.string(),
    plannedCareRoutine: z.string().optional(),
    veterinarianInfo: z
        .object({
            name: z.string(),
            contact: z.string(),
            clinic: z.string(),
        })
        .optional(),
    references: z.array(
        z.object({
            name: z.string(),
            relationship: z.string(),
            phone: z.string().optional(),
            email: commonSchemas.email.optional(),
            yearsKnown: z.number().optional(),
        })
    ),
});

// Review schema
export const reviewSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(10).max(1000),
    photos: z
        .array(
            z.object({
                url: commonSchemas.url,
                caption: z.string().optional(),
            })
        )
        .optional(),
}); 