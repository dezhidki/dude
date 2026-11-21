import type { MessageStructureObject } from 'imapflow';
import type { FileInfo } from '../web/api.ts';

// Attached files from a message's structure: parts marked as attachments, or parts with a file name
// that aren't images shown inside the text.
export function filesIn(node: MessageStructureObject | undefined, uid: number, out: FileInfo[] = []): FileInfo[] {
  if (!node) {
    return out;
  }
  if (node.childNodes) {
    node.childNodes.forEach((n) => {
      filesIn(n, uid, out);
    });
    return out;
  }
  const type = (node.type || '').toLowerCase();
  const name = node.dispositionParameters?.filename || node.parameters?.name || '';
  const attached = node.disposition === 'attachment';
  const bodyText = /^text\/(plain|html)$/.test(type) && !attached;
  const pictureInText = /^image\//.test(type) && !attached && (node.disposition === 'inline' || node.id); // signature logos etc.
  if ((attached || name) && !bodyText && !pictureInText) {
    out.push({ name: name || 'attachment', type, size: node.size || 0, uid });
  }
  return out;
}
