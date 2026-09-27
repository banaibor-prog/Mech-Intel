import { ProviderProfile, UserProfile } from '../types/models';

export interface MockProvider {
  user: UserProfile;
  provider: ProviderProfile;
}

const now = Date.now();

function avatarFor(seed: number): string {
  return `https://i.pravatar.cc/300?img=${seed}`;
}

export const MOCK_PROVIDERS: MockProvider[] = [
  {
    user: { uid: 'mock-1', displayName: 'Ramesh Kumar', email: 'ramesh.k@example.com', photoURL: avatarFor(12), isProvider: true, createdAt: now },
    provider: { uid: 'mock-1', skills: ['Electrician'], bio: 'Licensed electrician with 8 years of experience in home wiring, fan/light installation, and fault repair.', hourlyRate: 350, location: 'Andheri, Mumbai', yearsExperience: 8, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-2', displayName: 'Suresh Patil', email: 'suresh.p@example.com', photoURL: avatarFor(33), isProvider: true, createdAt: now },
    provider: { uid: 'mock-2', skills: ['Plumber'], bio: 'Expert in leak repairs, bathroom fittings, and pipeline installation. Available for emergency call-outs.', hourlyRate: 300, location: 'Powai, Mumbai', yearsExperience: 6, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-3', displayName: 'Anjali Devi', email: 'anjali.d@example.com', photoURL: avatarFor(47), isProvider: true, createdAt: now },
    provider: { uid: 'mock-3', skills: ['House Cleaner'], bio: 'Thorough and reliable home cleaning — deep cleaning, kitchen, bathroom, and daily upkeep.', hourlyRate: 200, location: 'Bandra, Mumbai', yearsExperience: 4, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-4', displayName: 'Vikram Singh', email: 'vikram.s@example.com', photoURL: avatarFor(15), isProvider: true, createdAt: now },
    provider: { uid: 'mock-4', skills: ['Helper'], bio: 'Strong and dependable — help with moving, loading, home shifting, and general labor work.', hourlyRate: 180, location: 'Dadar, Mumbai', yearsExperience: 3, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-5', displayName: 'Priya Sharma', email: 'priya.s@example.com', photoURL: avatarFor(45), isProvider: true, createdAt: now },
    provider: { uid: 'mock-5', skills: ['Artist', 'Painter'], bio: 'Custom portrait and mural artist. I also do wall art and canvas commissions for homes and events.', hourlyRate: 500, location: 'Juhu, Mumbai', yearsExperience: 5, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-6', displayName: 'Arjun Mehta', email: 'arjun.m@example.com', photoURL: avatarFor(14), isProvider: true, createdAt: now },
    provider: { uid: 'mock-6', skills: ['Musician'], bio: 'Guitarist and vocalist available for events, weddings, and private lessons. 10+ years performing.', hourlyRate: 800, location: 'Khar, Mumbai', yearsExperience: 10, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-7', displayName: 'Fatima Sheikh', email: 'fatima.s@example.com', photoURL: avatarFor(48), isProvider: true, createdAt: now },
    provider: { uid: 'mock-7', skills: ['Freelance Designer'], bio: 'Graphic and brand designer — logos, social media kits, and print design. Fast turnaround.', hourlyRate: 600, location: 'Remote / Mumbai', yearsExperience: 5, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-8', displayName: 'Deepak Verma', email: 'deepak.v@example.com', photoURL: avatarFor(17), isProvider: true, createdAt: now },
    provider: { uid: 'mock-8', skills: ['Carpenter'], bio: 'Custom furniture, repairs, and modular kitchen work. Quality craftsmanship guaranteed.', hourlyRate: 400, location: 'Malad, Mumbai', yearsExperience: 12, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-9', displayName: 'Sunita Rao', email: 'sunita.r@example.com', photoURL: avatarFor(44), isProvider: true, createdAt: now },
    provider: { uid: 'mock-9', skills: ['Cook'], bio: 'Home-style North & South Indian cooking. Available for daily meals or special occasions.', hourlyRate: 250, location: 'Chembur, Mumbai', yearsExperience: 7, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-10', displayName: 'Rahul Nair', email: 'rahul.n@example.com', photoURL: avatarFor(18), isProvider: true, createdAt: now },
    provider: { uid: 'mock-10', skills: ['Freelance Developer'], bio: 'Full-stack web & mobile app developer. React, Node.js, and Flutter. Open for short-term gigs.', hourlyRate: 1200, location: 'Remote', yearsExperience: 4, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-11', displayName: 'Meena Joshi', email: 'meena.j@example.com', photoURL: avatarFor(49), isProvider: true, createdAt: now },
    provider: { uid: 'mock-11', skills: ['Tutor'], bio: 'Mathematics and Science tutor for grades 6-10. Patient teaching style, home visits available.', hourlyRate: 300, location: 'Vile Parle, Mumbai', yearsExperience: 9, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-12', displayName: 'Karan Thakur', email: 'karan.t@example.com', photoURL: avatarFor(19), isProvider: true, createdAt: now },
    provider: { uid: 'mock-12', skills: ['Photographer'], bio: 'Event, portrait, and product photography. Own equipment, quick delivery, affordable packages.', hourlyRate: 700, location: 'Lower Parel, Mumbai', yearsExperience: 6, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-13', displayName: 'Naveen Reddy', email: 'naveen.r@example.com', photoURL: avatarFor(22), isProvider: true, createdAt: now },
    provider: { uid: 'mock-13', skills: ['Mechanic'], bio: 'Two-wheeler and car repair specialist. Doorstep service for minor repairs and servicing.', hourlyRate: 280, location: 'Kurla, Mumbai', yearsExperience: 11, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-14', displayName: 'Pooja Iyer', email: 'pooja.i@example.com', photoURL: avatarFor(29), isProvider: true, createdAt: now },
    provider: { uid: 'mock-14', skills: ['Gardener'], bio: 'Garden design, plant care, and landscaping for homes and terraces. Organic methods preferred.', hourlyRate: 220, location: 'Goregaon, Mumbai', yearsExperience: 5, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-15', displayName: 'Aakash Bhatt', email: 'aakash.b@example.com', photoURL: avatarFor(25), isProvider: true, createdAt: now },
    provider: { uid: 'mock-15', skills: ['Painter'], bio: 'Interior and exterior house painting, texture work, and waterproofing. Neat finish guaranteed.', hourlyRate: 320, location: 'Thane, Mumbai', yearsExperience: 9, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-16', displayName: 'Neha Kulkarni', email: 'neha.k@example.com', photoURL: avatarFor(31), isProvider: true, createdAt: now },
    provider: { uid: 'mock-16', skills: ['Freelance Writer'], bio: 'Content writer for blogs, product descriptions, and social media. SEO-friendly copy, quick turnaround.', hourlyRate: 450, location: 'Remote', yearsExperience: 3, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-17', displayName: 'Sameer Khan', email: 'sameer.k@example.com', photoURL: avatarFor(52), isProvider: true, createdAt: now },
    provider: { uid: 'mock-17', skills: ['Helper'], bio: 'Packing and moving services — careful with furniture, appliances, and fragile items. Own transport available.', hourlyRate: 500, location: 'Vikhroli, Mumbai', yearsExperience: 6, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-18', displayName: 'Divya Nambiar', email: 'divya.n@example.com', photoURL: avatarFor(41), isProvider: true, createdAt: now },
    provider: { uid: 'mock-18', skills: ['Tutor'], bio: 'English and communication skills coach for school students and working professionals.', hourlyRate: 350, location: 'Ghatkopar, Mumbai', yearsExperience: 6, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-19', displayName: 'Manoj Pillai', email: 'manoj.p@example.com', photoURL: avatarFor(53), isProvider: true, createdAt: now },
    provider: { uid: 'mock-19', skills: ['Electrician', 'Mechanic'], bio: 'Home appliance repair specialist — AC, washing machine, fridge, and general electrical work.', hourlyRate: 380, location: 'Mulund, Mumbai', yearsExperience: 10, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-20', displayName: 'Ritu Agarwal', email: 'ritu.a@example.com', photoURL: avatarFor(36), isProvider: true, createdAt: now },
    provider: { uid: 'mock-20', skills: ['Freelance Designer'], bio: 'UI/UX designer for mobile and web apps. Figma prototypes, design systems, and user research.', hourlyRate: 900, location: 'Remote', yearsExperience: 4, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-21', displayName: 'Vivek Chandran', email: 'vivek.c@example.com', photoURL: avatarFor(55), isProvider: true, createdAt: now },
    provider: { uid: 'mock-21', skills: ['Musician'], bio: 'Tabla and percussion player for classical and fusion performances. Available for events and lessons.', hourlyRate: 650, location: 'Matunga, Mumbai', yearsExperience: 15, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-22', displayName: 'Shreya Bose', email: 'shreya.b@example.com', photoURL: avatarFor(39), isProvider: true, createdAt: now },
    provider: { uid: 'mock-22', skills: ['Artist'], bio: 'Henna and face-paint artist for weddings, birthdays, and festivals. Custom designs on request.', hourlyRate: 400, location: 'Santacruz, Mumbai', yearsExperience: 7, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-23', displayName: 'Ajay Yadav', email: 'ajay.y@example.com', photoURL: avatarFor(51), isProvider: true, createdAt: now },
    provider: { uid: 'mock-23', skills: ['Mechanic'], bio: 'Car AC repair, denting-painting, and general servicing at your doorstep.', hourlyRate: 450, location: 'Borivali, Mumbai', yearsExperience: 8, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-24', displayName: 'Lakshmi Venkatesh', email: 'lakshmi.v@example.com', photoURL: avatarFor(43), isProvider: true, createdAt: now },
    provider: { uid: 'mock-24', skills: ['Cook'], bio: 'Specialist in South Indian breakfast and tiffin service. Weekly meal plans available.', hourlyRate: 280, location: 'Sion, Mumbai', yearsExperience: 5, available: true, updatedAt: now },
  },
  {
    user: { uid: 'mock-25', displayName: 'Harish Menon', email: 'harish.m@example.com', photoURL: avatarFor(57), isProvider: true, createdAt: now },
    provider: { uid: 'mock-25', skills: ['Freelance Developer'], bio: 'Backend engineer specializing in Node.js and Firebase. Available for short-term consulting.', hourlyRate: 1500, location: 'Remote', yearsExperience: 7, available: true, updatedAt: now },
  },
];
