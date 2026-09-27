import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GeoPoint } from '../types/models';

Geolocation.setRNConfiguration({ skipPermissionRequests: true, locationProvider: 'auto' });

export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
  if ((await PermissionsAndroid.check(fine)) || (await PermissionsAndroid.check(coarse))) return true;
  const result = await PermissionsAndroid.requestMultiple([fine, coarse]);
  return (
    result[fine] === PermissionsAndroid.RESULTS.GRANTED ||
    result[coarse] === PermissionsAndroid.RESULTS.GRANTED
  );
}

function readPosition(enableHighAccuracy: boolean, timeout: number): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy, timeout, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/** The device's current position, or null if permission is denied or no fix arrives in time. */
export async function getCurrentCoords(): Promise<GeoPoint | null> {
  if (!(await ensureLocationPermission())) return null;
  try {
    return await readPosition(true, 12000);
  } catch {
    try {
      return await readPosition(false, 15000);
    } catch {
      return null;
    }
  }
}

/**
 * Rounds to 3 decimal places (~100 m). Posts and provider pins are public, so we never
 * store anyone's exact doorstep — close enough to show the right street, not the house.
 */
export function approximate(point: GeoPoint): GeoPoint {
  return { lat: Math.round(point.lat * 1000) / 1000, lng: Math.round(point.lng * 1000) / 1000 };
}

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Standard geohash, for future range queries by area. */
export function encodeGeohash({ lat, lng }: GeoPoint, precision = 7): string {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch = (ch << 1) | 1;
        lngMin = mid;
      } else {
        ch <<= 1;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch = (ch << 1) | 1;
        latMin = mid;
      } else {
        ch <<= 1;
        latMax = mid;
      }
    }
    even = !even;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

const RECORD_INTERVAL_MS = 10 * 60 * 1000;
let lastRecordedAt = 0;
let lastRecordedKey = '';

/**
 * Records where the user is while they use the app, so providers show up on the Explore
 * map near where they actually work. Throttled to once every 10 minutes.
 */
export async function recordUserLocation(uid: string, isProvider: boolean): Promise<GeoPoint | null> {
  // Becoming a provider mid-session must not wait out the throttle, or they'd be missing from the map.
  const key = `${uid}:${isProvider}`;
  if (key === lastRecordedKey && Date.now() - lastRecordedAt < RECORD_INTERVAL_MS) return null;
  const coords = await getCurrentCoords();
  if (!coords) return null;
  lastRecordedAt = Date.now();
  lastRecordedKey = key;
  const point = approximate(coords);
  await setDoc(doc(db, 'users', uid), { lastCoords: point }, { merge: true });
  if (isProvider) {
    await setDoc(
      doc(db, 'providers', uid),
      { coords: point, geohash: encodeGeohash(point), coordsUpdatedAt: Date.now() },
      { merge: true },
    );
  }
  return point;
}
