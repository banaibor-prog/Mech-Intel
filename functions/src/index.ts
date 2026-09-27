import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onReviewWritten, onReferenceWritten, onTrustActionWritten } from './trust';
