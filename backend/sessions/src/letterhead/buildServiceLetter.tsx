import fs from 'node:fs/promises';
import path from 'node:path';

import { SessionStatus, type Checkpoint, type Session } from '@prisma/client';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import sharp from 'sharp';

import { prisma } from '../prisma.js';
import { letterheadAssetsDir } from './assetsPath.js';
import {
  formatHoursValue,
  formatLetterDate,
  formatMiles,
  formatSessionDate,
  formatSessionDateTime,
  sessionHours,
} from './formatters.js';
import {
  ServiceLetterDocument,
  type ServiceLetterPdfProps,
  type ServiceLetterSessionEvidence,
} from './ServiceLetterPdf.js';
import { renderStaticRouteMapPng } from './staticRouteMap.js';
import { createSignedPhotoUrl, getVolunteerDisplayName } from './supabaseAdmin.js';

type SessionWithCheckpoints = Session & { checkpoints: Checkpoint[] };

export class ServiceLetterError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ServiceLetterError';
  }
}

async function readAssetDataUri(filename: string, mime: string): Promise<string> {
  const filePath = path.join(letterheadAssetsDir(), filename);
  const buffer = await fs.readFile(filePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    buffer = await sharp(buffer).rotate().jpeg({ quality: 72 }).toBuffer();
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

function bufferToDataUri(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function sessionRangeBounds(sessions: SessionWithCheckpoints[]): { start: Date | null; end: Date | null } {
  let start: Date | null = null;
  let end: Date | null = null;

  for (const session of sessions) {
    if (session.startedAt) {
      if (!start || session.startedAt < start) {
        start = session.startedAt;
      }
    }
    const sessionEnd = session.endedAt ?? session.startedAt;
    if (sessionEnd) {
      if (!end || sessionEnd > end) {
        end = sessionEnd;
      }
    }
  }

  return { start, end };
}

async function buildSessionEvidence(session: SessionWithCheckpoints): Promise<ServiceLetterSessionEvidence> {
  const mapPng = await renderStaticRouteMapPng(session.route);
  const mapImageDataUri = mapPng ? bufferToDataUri(mapPng, 'image/png') : null;

  const photos: ServiceLetterSessionEvidence['photos'] = [];
  for (const checkpoint of session.checkpoints) {
    const entries: Array<{ path: string | null; label: string; capturedAt: Date | null }> = [
      { path: checkpoint.selfiePath, label: 'Selfie checkpoint', capturedAt: checkpoint.capturedAt },
      { path: checkpoint.progressPath, label: 'Progress photo', capturedAt: checkpoint.capturedAt },
    ];

    for (const entry of entries) {
      const signed = await createSignedPhotoUrl(entry.path);
      if (!signed) {
        continue;
      }
      const dataUri = await fetchImageDataUri(signed);
      if (!dataUri) {
        continue;
      }
      photos.push({
        label: entry.label,
        timeLabel: entry.capturedAt ? formatSessionDateTime(entry.capturedAt) : '',
        dataUri,
      });
    }
  }

  const title = session.activity?.trim() || session.description?.trim() || 'Cleanup session';
  const hours = sessionHours(session);

  return {
    title,
    startLabel: formatSessionDateTime(session.startedAt),
    endLabel: formatSessionDateTime(session.endedAt),
    hoursLabel: formatHoursValue(hours),
    milesLabel: formatMiles(session.distanceMiles),
    mapImageDataUri,
    photos,
  };
}

export async function loadSessionsForServiceLetter(
  sessionIds: string[],
  options: { userId?: string; isAdmin: boolean },
): Promise<SessionWithCheckpoints[]> {
  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new ServiceLetterError('At least one session id is required', 400);
  }

  const sessions = await prisma.session.findMany({
    where: { id: { in: uniqueIds } },
    include: { checkpoints: { orderBy: { capturedAt: 'asc' } } },
  });

  if (sessions.length !== uniqueIds.length) {
    throw new ServiceLetterError('One or more sessions were not found', 404);
  }

  for (const session of sessions) {
    if (session.status !== SessionStatus.approved) {
      throw new ServiceLetterError('Only approved sessions can be exported as a service letter', 400);
    }
    if (!options.isAdmin && options.userId && session.userId !== options.userId) {
      throw new ServiceLetterError('Forbidden', 403);
    }
  }

  const volunteerIds = new Set(sessions.map((session) => session.userId));
  if (!options.isAdmin && volunteerIds.size > 1) {
    throw new ServiceLetterError('All sessions must belong to the same volunteer', 400);
  }

  sessions.sort((a, b) => {
    const aTime = a.startedAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.startedAt?.getTime() ?? b.createdAt.getTime();
    return aTime - bTime;
  });

  return sessions;
}

export async function buildServiceLetterPdf(
  sessionIds: string[],
  options: { userId?: string; isAdmin: boolean },
): Promise<{ buffer: Buffer; filename: string }> {
  const sessions = await loadSessionsForServiceLetter(sessionIds, options);
  const volunteerId = sessions[0]?.userId;
  if (!volunteerId) {
    throw new ServiceLetterError('Session data invalid', 500);
  }

  const volunteerName = await getVolunteerDisplayName(volunteerId);
  const totalHours = sessions.reduce((sum, session) => sum + sessionHours(session), 0);
  const { start, end } = sessionRangeBounds(sessions);

  const [logoDataUri, signatureDataUri, ...sessionEvidence] = await Promise.all([
    readAssetDataUri('logo-icon-78x94.jpg', 'image/jpeg'),
    readAssetDataUri('DonnaAdamSignature.png', 'image/png'),
    ...sessions.map((session) => buildSessionEvidence(session)),
  ]);

  const props: ServiceLetterPdfProps = {
    volunteerName,
    letterDate: formatLetterDate(new Date()),
    rangeStart: formatSessionDate(start),
    rangeEnd: formatSessionDate(end),
    totalHoursLabel: formatHoursValue(totalHours),
    logoDataUri,
    signatureDataUri,
    sessions: sessionEvidence,
  };

  const buffer = await renderToBuffer(<ServiceLetterDocument {...props} />);

  await prisma.session.updateMany({
    where: { id: { in: sessions.map((session) => session.id) } },
    data: { letterheadGeneratedAt: new Date() },
  });

  const today = new Date().toISOString().slice(0, 10);
  const filename =
    sessions.length > 1
      ? `CGB-Service-Letter-${today}-multi.pdf`
      : `CGB-Service-Letter-${today}.pdf`;

  return { buffer: Buffer.from(buffer), filename };
}
