import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { ORG } from './orgConstants.js';

export type ServiceLetterPhoto = {
  label: string;
  timeLabel: string;
  dataUri: string;
};

export type ServiceLetterSessionEvidence = {
  title: string;
  startLabel: string;
  endLabel: string;
  hoursLabel: string;
  milesLabel: string;
  mapImageDataUri: string | null;
  photos: ServiceLetterPhoto[];
};

export type ServiceLetterPdfProps = {
  volunteerName: string;
  letterDate: string;
  rangeStart: string;
  rangeEnd: string;
  totalHoursLabel: string;
  logoDataUri: string;
  signatureDataUri: string;
  sessions: ServiceLetterSessionEvidence[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.45,
    color: '#1a1a1a',
  },
  logo: {
    width: 78,
    height: 94,
    marginBottom: 8,
  },
  orgLine: {
    fontSize: 10,
    marginBottom: 4,
  },
  taxId: {
    fontSize: 10,
    marginBottom: 28,
  },
  bodyGap: {
    marginBottom: 14,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'left',
  },
  signature: {
    width: 160,
    height: 48,
    marginTop: 8,
    marginBottom: 4,
  },
  signBlock: {
    fontSize: 11,
    lineHeight: 1.35,
  },
  evidenceTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    marginBottom: 8,
  },
  evidenceMeta: {
    fontSize: 11,
    marginBottom: 6,
  },
  map: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  photoCard: {
    width: '47%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  photoCaption: {
    fontSize: 9,
    marginTop: 4,
  },
});

function LetterPage({
  volunteerName,
  letterDate,
  rangeStart,
  rangeEnd,
  totalHoursLabel,
  logoDataUri,
  signatureDataUri,
}: Omit<ServiceLetterPdfProps, 'sessions'>) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Image src={logoDataUri} style={styles.logo} />
      <Text style={styles.orgLine}>{ORG.addressLine}</Text>
      <Text style={styles.taxId}>{ORG.taxId}</Text>

      <Text style={styles.bodyGap}>Date {letterDate}</Text>
      <Text style={styles.bodyGap}>Dear {volunteerName},</Text>
      <Text style={styles.bodyGap}>
        Service hours earned from {rangeStart} to {rangeEnd} total {totalHoursLabel} community
        service hours.
      </Text>

      <Text style={styles.paragraph}>
        Thank you for supporting Clean Up – Give Back’s mission of environmental stewardship. Your
        assistance helps keep our communities and environment cleaner and healthier for the residents
        and animal life in the area. Your dedication to sustainability makes a meaningful difference.
      </Text>
      <Text style={styles.paragraph}>We are grateful you chose to help our non-profit.</Text>

      <Text style={styles.bodyGap}>Sincerely,</Text>
      <Image src={signatureDataUri} style={styles.signature} />
      <View style={styles.signBlock}>
        <Text>{ORG.signatoryTitle}</Text>
        <Text>{ORG.signatoryOrg}</Text>
        <Text>{ORG.tagline}</Text>
        <Text>{ORG.email}</Text>
      </View>
    </Page>
  );
}

function EvidencePage({ session }: { session: ServiceLetterSessionEvidence }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.evidenceTitle}>{session.title}</Text>
      <Text style={styles.evidenceMeta}>Start: {session.startLabel}</Text>
      <Text style={styles.evidenceMeta}>End: {session.endLabel}</Text>
      <Text style={styles.evidenceMeta}>
        Duration: {session.hoursLabel} hours · Distance: {session.milesLabel} miles
      </Text>

      {session.mapImageDataUri ? (
        <Image src={session.mapImageDataUri} style={styles.map} />
      ) : (
        <Text style={styles.evidenceMeta}>Route map unavailable for this session.</Text>
      )}

      {session.photos.length > 0 ? (
        <View style={styles.photoRow}>
          {session.photos.map((photo, index) => (
            <View key={`${photo.label}-${index}`} style={styles.photoCard}>
              <Image src={photo.dataUri} style={styles.photo} />
              <Text style={styles.photoCaption}>
                {photo.label}
                {photo.timeLabel ? ` · ${photo.timeLabel}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.evidenceMeta}>No checkpoint photos recorded.</Text>
      )}
    </Page>
  );
}

export function ServiceLetterDocument(props: ServiceLetterPdfProps) {
  return (
    <Document>
      <LetterPage {...props} />
      {props.sessions.map((session, index) => (
        <EvidencePage session={session} key={`evidence-${index}`} />
      ))}
    </Document>
  );
}
