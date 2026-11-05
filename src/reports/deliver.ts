/**
 * Gets a report out of FAITH, always by the person's own action: the phone's email app opens with
 * the PDF attached (they press Send), or the share sheet opens. FAITH itself never sends anything and
 * keeps no copy beyond the temporary PDF in the app's cache. In the browser there are no files to
 * attach, so the email carries the summary and the full report is printed (or saved as PDF) instead.
 */
import { File, Paths } from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { reportEmailBody, reportFileName, reportHtml, reportTitle, type MarkerReport } from './markerReport';

/** A4 in points (expo-print uses 72 per inch). */
const A4 = { width: 595, height: 842 };

export type DeliveryResult = 'email' | 'email-summary' | 'share' | 'print';

async function makePdf(report: MarkerReport): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: reportHtml(report), ...A4 });
  // Give the attachment a name that says what it is (the printed file has a random one).
  const dest = new File(Paths.cache, reportFileName(report));
  if (dest.exists) dest.delete();
  const src = new File(uri);
  src.copy(dest);
  try {
    src.delete();
  } catch {
    // Left in the cache; the system clears it.
  }
  return dest.uri;
}

function printOnWeb(html: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 60_000);
  }, 300);
}

export async function emailReport(report: MarkerReport, recipient: string | null): Promise<DeliveryResult> {
  const subject = `FAITH AI ${reportTitle(report)}`;
  const recipients = recipient ? [recipient] : [];
  if (Platform.OS === 'web') {
    await MailComposer.composeAsync({ recipients, subject, body: reportEmailBody(report, false) });
    return 'email-summary';
  }
  const pdf = await makePdf(report);
  if (await MailComposer.isAvailableAsync()) {
    await MailComposer.composeAsync({ recipients, subject, body: reportEmailBody(report, true), attachments: [pdf] });
    return 'email';
  }
  // No email account on this phone: hand the PDF to any app (Gmail, Messenger, Viber, Files…).
  await Sharing.shareAsync(pdf, { mimeType: 'application/pdf', dialogTitle: subject, UTI: 'com.adobe.pdf' });
  return 'share';
}

export async function shareOrPrintReport(report: MarkerReport): Promise<DeliveryResult> {
  if (Platform.OS === 'web') {
    printOnWeb(reportHtml(report));
    return 'print';
  }
  const pdf = await makePdf(report);
  await Sharing.shareAsync(pdf, { mimeType: 'application/pdf', dialogTitle: `FAITH AI ${reportTitle(report)}`, UTI: 'com.adobe.pdf' });
  return 'share';
}
