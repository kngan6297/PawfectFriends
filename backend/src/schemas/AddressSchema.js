import mongoose from 'mongoose';

export const AddressSchema = new mongoose.Schema(
  {
    version: { type: String, enum: ['v1', 'v2'], default: 'v1' },

    // Save code & meta from API
    province: {
      code: { type: Number, required: true, index: true }, // e.g. 79 (HCMC)
      name: { type: String, required: true, trim: true }, // "Ho Chi Minh City"
      codename: { type: String, trim: true }, // "tp_ho_chi_minh"
      division_type: { type: String, trim: true }, // "central city"
      phone_code: { type: Number }, // 28 or 24...
    },
    district: {
      code: { type: Number, required: true, index: true }, // e.g. 769 (Tan Binh District)
      name: { type: String, required: true, trim: true },
      codename: { type: String, trim: true }, // "quan_tan_binh"
      division_type: { type: String, trim: true }, // "district" | "district" | ...
      province_code: { type: Number, required: true }, // for self-check to be valid
    },
    ward: {
      code: { type: Number, required: true, index: true }, // e.g. 26734 (Ward 7)
      name: { type: String, required: true, trim: true },
      codename: { type: String, trim: true }, // "phuong_7"
      division_type: { type: String, trim: true }, // "ward" | "commune" | ...
      district_code: { type: Number, required: true },
    },

    // Details of street/room/house number entered by the user hand
    details: {
      street: { type: String, trim: true }, // "123 Ly Thuong Kiet"
      // optional: building, room, note...
      note: { type: String, trim: true },
    },

    postalCode: { type: String, trim: true }, // 700000
    country: { type: String, default: 'VN' },

    // Display string (denormalize for fast rendering)
    formatted: { type: String, trim: true },
  },
  { _id: false }
);

// Validate the code relationship
AddressSchema.pre('validate', function (next) {
  try {
    if (this.district && this.province) {
      if (this.district.province_code !== this.province.code) {
        return next(
          new Error('district.province_code does not match province.code')
        );
      }
    }
    if (this.ward && this.district) {
      if (this.ward.district_code !== this.district.code) {
        return next(
          new Error('ward.district_code does not match district.code')
        );
      }
    }
    // build formatted if missing
    if (!this.formatted && this.province && this.district && this.ward) {
      const parts = [
        this.details?.street,
        this.ward.name,
        this.district.name,
        this.province.name,
        this.postalCode,
        this.country,
      ].filter(Boolean);
      this.formatted = parts.join(', ');
    }
    next();
  } catch (e) {
    next(e);
  }
});
