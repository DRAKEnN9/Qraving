import { formatPrice, generateSlug, isValidEmail, sanitizeInput } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    it('should format cents to USD currency', () => {
      expect(formatPrice(1500)).toBe('$15.00');
      expect(formatPrice(999)).toBe('$9.99');
      expect(formatPrice(10000)).toBe('$100.00');
    });

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });
  });

  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      expect(generateSlug('My Restaurant')).toBe('my-restaurant');
      expect(generateSlug('UPPERCASE TEXT')).toBe('uppercase-text');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Restaurant & Café!')).toBe('restaurant-caf');
    });

    it('should replace multiple spaces with single hyphen', () => {
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should trim leading and trailing spaces', () => {
      expect(generateSlug('  Trimmed  ')).toBe('trimmed');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no@.com')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('Hello<script>alert("xss")</script>')).toBe(
        'Helloscriptalert("xss")/script'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  text  ')).toBe('text');
    });

    it('should limit length to 1000 characters', () => {
      const longText = 'a'.repeat(1500);
      const sanitized = sanitizeInput(longText);
      expect(sanitized.length).toBe(1000);
    });
  });
});
