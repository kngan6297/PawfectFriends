/**
 * Contract Template Engine for Adoption Contracts
 * Supports i18n (Vietnamese/English), custom terms, and versioning
 *
 * @deprecated Use contractTemplate.service.js instead
 */

import { ContractLanguage, ContractStatus } from '../types/adoption.js';
import {
  buildAdoptionContract as buildContract,
  getAvailableLanguages,
  getContractTemplateInfo,
  validateContractOptions,
} from '../services/contractTemplate.service.js';

// Contract templates for different languages
const CONTRACT_TEMPLATES = {
  en: {
    title: 'Pet Adoption Agreement',
    description: 'Official adoption agreement between shelter and adopter',
    version: '1.0',
    template: `
# PET ADOPTION AGREEMENT

**Agreement Date:** {{currentDate}}  
**Contract ID:** {{contractId}}

---

## PARTIES

**SHELTER:** {{shelter.name}}  
Address: {{shelter.address}}  
Phone: {{shelter.phone}}  
Email: {{shelter.email}}  

**ADOPTER:** {{user.name}}  
Email: {{user.email}}  
Phone: {{user.phone}}  

---

## PET DETAILS

**Name:** {{pet.name}}  
**Type:** {{pet.type}}  
**Breed:** {{pet.breed}}  
**Age:** {{pet.age}}  
**Description:** {{pet.description}}  

---

## TERMS AND CONDITIONS

### 1. ADOPTION FEE
The adopter agrees to pay any applicable adoption fees as determined by the shelter.

### 2. CARE RESPONSIBILITIES
The adopter agrees to provide proper care for the pet including:
- Adequate food, water, and shelter
- Regular veterinary care and vaccinations
- Exercise and mental stimulation
- Love and attention

### 3. HEALTH GUARANTEE
The shelter warrants that the pet is in good health at the time of adoption. Any pre-existing conditions have been disclosed.

### 4. RETURN POLICY
If the adopter is unable to keep the pet, they must return it to the shelter rather than rehoming independently.

### 5. SPAY/NEUTER
If the pet is not already spayed/neutered, the adopter agrees to have this procedure done within 30 days of adoption.

### 6. IDENTIFICATION
The adopter agrees to ensure the pet has proper identification (microchip, tags) at all times.

### 7. LEGAL OWNERSHIP
Legal ownership of the pet transfers to the adopter upon completion of this agreement and payment of any fees.

### 8. COMPLIANCE
The adopter agrees to comply with all local laws and regulations regarding pet ownership.

---

## ADDITIONAL TERMS
{{additionalTerms}}

---

## SIGNATURES

**SHELTER REPRESENTATIVE:** _________________ Date: _______  
**ADOPTER SIGNATURE:** _________________ Date: _______

---

*This agreement is binding and enforceable by law.*
    `,
  },
  vi: {
    title: 'Hợp Đồng Nhận Nuôi Thú Cưng',
    description:
      'Hợp đồng nhận nuôi chính thức giữa trại cứu trợ và người nhận nuôi',
    version: '1.0',
    template: `
# HỢP ĐỒNG NHẬN NUÔI THÚ CƯNG

**Ngày ký hợp đồng:** {{currentDate}}  
**Mã hợp đồng:** {{contractId}}

---

## CÁC BÊN

**TRẠI CỨU TRỢ:** {{shelter.name}}  
Địa chỉ: {{shelter.address}}  
Điện thoại: {{shelter.phone}}  
Email: {{shelter.email}}  

**NGƯỜI NHẬN NUÔI:** {{user.name}}  
Email: {{user.email}}  
Điện thoại: {{user.phone}}  

---

## THÔNG TIN THÚ CƯNG

**Tên:** {{pet.name}}  
**Loài:** {{pet.type}}  
**Giống:** {{pet.breed}}  
**Tuổi:** {{pet.age}}  
**Mô tả:** {{pet.description}}  

---

## ĐIỀU KHOẢN VÀ ĐIỀU KIỆN

### 1. PHÍ NHẬN NUÔI
Người nhận nuôi đồng ý thanh toán các khoản phí nhận nuôi theo quy định của trại cứu trợ.

### 2. TRÁCH NHIỆM CHĂM SÓC
Người nhận nuôi đồng ý cung cấp sự chăm sóc phù hợp cho thú cưng bao gồm:
- Thức ăn, nước uống và nơi ở đầy đủ
- Chăm sóc thú y thường xuyên và tiêm phòng
- Vận động và kích thích tinh thần
- Tình yêu thương và sự quan tâm

### 3. BẢO HÀNH SỨC KHỎE
Trại cứu trợ đảm bảo rằng thú cưng có sức khỏe tốt tại thời điểm nhận nuôi. Mọi tình trạng sức khỏe có sẵn đã được tiết lộ.

### 4. CHÍNH SÁCH HOÀN TRẢ
Nếu người nhận nuôi không thể giữ thú cưng, họ phải trả lại cho trại cứu trợ thay vì tìm nơi ở mới độc lập.

### 5. TRIỆT SẢN
Nếu thú cưng chưa được triệt sản, người nhận nuôi đồng ý thực hiện thủ thuật này trong vòng 30 ngày kể từ khi nhận nuôi.

### 6. NHẬN DẠNG
Người nhận nuôi đồng ý đảm bảo thú cưng có nhận dạng phù hợp (chip điện tử, thẻ) mọi lúc.

### 7. QUYỀN SỞ HỮU HỢP PHÁP
Quyền sở hữu hợp pháp của thú cưng chuyển giao cho người nhận nuôi khi hoàn thành hợp đồng này và thanh toán các khoản phí.

### 8. TUÂN THỦ
Người nhận nuôi đồng ý tuân thủ mọi luật pháp và quy định địa phương về sở hữu thú cưng.

---

## ĐIỀU KHOẢN BỔ SUNG
{{additionalTerms}}

---

## CHỮ KÝ

**ĐẠI DIỆN TRẠI CỨU TRỢ:** _________________ Ngày: _______  
**CHỮ KÝ NGƯỜI NHẬN NUÔI:** _________________ Ngày: _______

---

*Hợp đồng này có hiệu lực pháp lý và có thể thực thi theo pháp luật.*
    `,
  },
};

/**
 * Build adoption contract with template engine
 * @param {Object} adoptionData - Populated adoption request data
 * @param {Object} options - Contract generation options
 * @param {string} options.language - Language code (en/vi)
 * @param {string} options.customTerms - Custom additional terms
 * @param {string} options.version - Contract version
 * @returns {Object} Contract details with title, description, terms, and content
 */
export const buildAdoptionContract = (adoptionData, options = {}) => {
  const {
    language = 'en',
    customTerms = '',
    version = '1.0',
    title,
    description,
  } = options;

  // Use the new service
  return buildContract({
    lang: language,
    title,
    description,
    extraTerms: customTerms,
    adoption: adoptionData,
  });
};

// Re-export functions from the service
export {
  getAvailableLanguages,
  getContractTemplateInfo,
  validateContractOptions,
};
