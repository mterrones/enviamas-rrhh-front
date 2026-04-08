import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type MailSettings = components["schemas"]["MailSettings"];
export type MailSettingsEnvelope = components["schemas"]["MailSettingsEnvelope"];
export type MailSettingsWrite = components["schemas"]["MailSettingsWrite"];
export type MailTestEnvelope = components["schemas"]["MailTestEnvelope"];

export async function fetchMailSettings() {
  return apiRequest<MailSettingsEnvelope>("/settings/mail");
}

export async function updateMailSettings(body: MailSettingsWrite) {
  return apiRequest<MailSettingsEnvelope>("/settings/mail", {
    method: "PUT",
    body,
  });
}

export async function sendMailTest(to: string) {
  return apiRequest<MailTestEnvelope>("/settings/mail/test", {
    method: "POST",
    body: { to },
  });
}
