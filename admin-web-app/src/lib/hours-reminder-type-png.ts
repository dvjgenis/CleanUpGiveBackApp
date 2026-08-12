/**
 * Rasterize hours-reminder Sanchez / Noto Sans copy to PNG.
 * Gmail strips webfonts — same approach as the Forgot Password email.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactNode } from 'react';

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

import {
  HOURS_REMINDER_ASSET_BASE,
  HOURS_REMINDER_CHROME_FILES,
  HOURS_REMINDER_CTA_LABEL,
  HOURS_REMINDER_HOURS_BG,
  HOURS_REMINDER_HOURS_FG,
  HOURS_REMINDER_TYPE_FILES,
  HOURS_REMINDER_TYPE_FONT_SIZE,
  HOURS_REMINDER_TYPE_FONT_SIZE_MOBILE,
  HOURS_REMINDER_TYPE_SIZES,
  buildHoursReminderEmailHtml,
  hoursReminderHeadline,
  hoursReminderHoursLine,
  type HoursReminderEmailInput,
} from './hours-reminder-email-html';

type SatoriNode = {
  type: string;
  props: Record<string, unknown>;
};

export function emailPublicDir(): string {
  const fromCwd = join(process.cwd(), 'public/email');
  if (existsSync(join(fromCwd, 'logo-mark.png'))) return fromCwd;
  return join(dirname(fileURLToPath(import.meta.url)), '../../public/email');
}

function loadFonts(): { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] {
  const dir = join(emailPublicDir(), 'fonts');
  return [
    {
      name: 'Sanchez',
      data: readFileSync(join(dir, 'Sanchez-Regular.ttf')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Noto Sans',
      data: readFileSync(join(dir, 'NotoSans-Bold.ttf')),
      weight: 700,
      style: 'normal',
    },
  ];
}

async function rasterize(node: SatoriNode, width: number, height: number): Promise<Buffer> {
  const svg = await satori(node as unknown as ReactNode, { width, height, fonts: loadFonts() });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
  });
  return Buffer.from(resvg.render().asPng());
}

/** Satori will not wrap a single text node; break into lines by character budget. */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function stackedLines(
  text: string,
  maxChars: number,
  fontSize: number,
  style: Record<string, unknown>,
): SatoriNode {
  const lines = wrapText(text, maxChars);
  const gap = fontSize <= 16 ? 6 : 10;
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      },
      children: lines.map((line) => ({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: 'Sanchez',
            fontSize,
            marginBottom: gap,
          },
          children: line,
        },
      })),
    },
  };
}

function hoursNode(hoursLine: string, fontSize: number): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: HOURS_REMINDER_HOURS_BG,
        color: HOURS_REMINDER_HOURS_FG,
        fontFamily: 'Noto Sans',
        fontSize,
        fontWeight: 700,
        textAlign: 'center',
      },
      children: hoursLine,
    },
  };
}

export async function renderHoursReminderTypePngs(input: {
  volunteerName?: string | null;
  currentHours?: number | null;
}): Promise<{
  body: Buffer;
  bodyMobile: Buffer;
  hours: Buffer;
  hoursMobile: Buffer;
  button: Buffer;
}> {
  const headline = hoursReminderHeadline(input.volunteerName);
  const hoursLine = hoursReminderHoursLine(input.currentHours);
  const sizes = HOURS_REMINDER_TYPE_SIZES;

  const [body, bodyMobile, hours, hoursMobile, button] = await Promise.all([
    rasterize(
      stackedLines(headline, 52, HOURS_REMINDER_TYPE_FONT_SIZE, {
        width: '100%',
        height: '100%',
        backgroundColor: '#009540',
        color: '#ffffff',
        fontFamily: 'Sanchez',
        fontSize: HOURS_REMINDER_TYPE_FONT_SIZE,
      }),
      sizes.body.width,
      sizes.body.height,
    ),
    rasterize(
      stackedLines(headline, 24, HOURS_REMINDER_TYPE_FONT_SIZE_MOBILE, {
        width: '100%',
        height: '100%',
        backgroundColor: '#009540',
        color: '#ffffff',
        fontFamily: 'Sanchez',
        fontSize: HOURS_REMINDER_TYPE_FONT_SIZE_MOBILE,
      }),
      sizes.bodyMobile.width,
      sizes.bodyMobile.height,
    ),
    rasterize(hoursNode(hoursLine, HOURS_REMINDER_TYPE_FONT_SIZE), sizes.hours.width, sizes.hours.height),
    rasterize(
      hoursNode(hoursLine, HOURS_REMINDER_TYPE_FONT_SIZE_MOBILE),
      sizes.hoursMobile.width,
      sizes.hoursMobile.height,
    ),
    rasterize(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#c2d832',
            color: '#3e4a3d',
            fontFamily: 'Sanchez',
            fontSize: 18,
          },
          children: HOURS_REMINDER_CTA_LABEL,
        },
      },
      sizes.button.width,
      sizes.button.height,
    ),
  ]);

  return { body, bodyMobile, hours, hoursMobile, button };
}

export type HoursReminderInlineAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  inlineContentId: string;
};

export async function buildHoursReminderEmailForSend(
  input: HoursReminderEmailInput = {},
): Promise<{ html: string; attachments: HoursReminderInlineAttachment[] }> {
  const pngs = await renderHoursReminderTypePngs(input);
  const assetDir = emailPublicDir();
  const assetBase = (input.assetBase?.trim() || HOURS_REMINDER_ASSET_BASE).replace(/\/$/, '');
  const html = buildHoursReminderEmailHtml(input).replaceAll(`${assetBase}/`, 'cid:');
  return {
    html,
    attachments: [
      {
        filename: 'logo-mark.png',
        content: readFileSync(join(assetDir, 'logo-mark.png')),
        contentType: 'image/png',
        inlineContentId: 'logo-mark.png',
      },
      {
        filename: 'nudge-bell.gif',
        content: readFileSync(join(assetDir, 'nudge-bell.gif')),
        contentType: 'image/gif',
        inlineContentId: 'nudge-bell.gif',
      },
      {
        filename: HOURS_REMINDER_TYPE_FILES.body,
        content: pngs.body,
        contentType: 'image/png',
        inlineContentId: HOURS_REMINDER_TYPE_FILES.body,
      },
      {
        filename: HOURS_REMINDER_TYPE_FILES.bodyMobile,
        content: pngs.bodyMobile,
        contentType: 'image/png',
        inlineContentId: HOURS_REMINDER_TYPE_FILES.bodyMobile,
      },
      {
        filename: HOURS_REMINDER_TYPE_FILES.hours,
        content: pngs.hours,
        contentType: 'image/png',
        inlineContentId: HOURS_REMINDER_TYPE_FILES.hours,
      },
      {
        filename: HOURS_REMINDER_TYPE_FILES.hoursMobile,
        content: pngs.hoursMobile,
        contentType: 'image/png',
        inlineContentId: HOURS_REMINDER_TYPE_FILES.hoursMobile,
      },
      {
        filename: HOURS_REMINDER_TYPE_FILES.button,
        content: pngs.button,
        contentType: 'image/png',
        inlineContentId: HOURS_REMINDER_TYPE_FILES.button,
      },
      ...Object.values(HOURS_REMINDER_CHROME_FILES).map((filename) => ({
        filename,
        content: readFileSync(join(assetDir, filename)),
        contentType: 'image/png',
        inlineContentId: filename,
      })),
    ],
  };
}
