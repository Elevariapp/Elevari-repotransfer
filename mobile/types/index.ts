export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  currency: string;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  rating: number;
  reviewCount: number;
  isInstantBook: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  property: Property;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  basePrice: number;
  serviceFee: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: string;
}

export interface QuoteRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface QuoteResponse {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  basePrice: number;
  serviceFee: number;
  total: number;
  currency: string;
  validUntil: string;
}

export interface PushToken {
  token: string;
  type: 'ios' | 'android' | 'expo';
  deviceId: string;
}