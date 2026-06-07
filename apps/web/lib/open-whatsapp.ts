/** Ouvre WhatsApp (app mobile ou WhatsApp Web / bureau). */
export function openWhatsApp(url: string): void {
  window.location.assign(url);
}
