import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { isApiConfigured } from './api';
import { getAccessToken } from './supabase';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

async function writePdfAndShare(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const target = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(target, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(target, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Service letter PDF',
  });
}

/** Download approved session letter PDF and open the system share sheet. */
export async function downloadServiceLetterPdf(sessionIds: string[]): Promise<void> {
  if (!isApiConfigured || !API_URL) {
    throw new Error('API URL not configured');
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error('No sessions selected');
  }

  let response: Response;
  if (uniqueIds.length === 1) {
    response = await fetch(`${API_URL}/sessions/${uniqueIds[0]}/service-letter.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    response = await fetch(`${API_URL}/sessions/service-letter.pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionIds: uniqueIds }),
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Download failed (${response.status})`);
  }

  const filename =
    filenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    `CGB-Service-Letter-${new Date().toISOString().slice(0, 10)}.pdf`;

  const arrayBuffer = await response.arrayBuffer();
  await writePdfAndShare(arrayBuffer, filename);
}
