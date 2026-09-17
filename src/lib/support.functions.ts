import { supabase } from "@/integrations/supabase/client";

interface TicketPayload {
  data: {
    ticketId: string;
  };
}

export async function sendSupportEmail(payload: TicketPayload) {
  const ticketId = payload?.data?.ticketId;
  if (!ticketId) throw new Error("ticketId is required");

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("id, subject, message, category, contact_email, created_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!ticket) return { sent: false, reason: "ticket_not_found" as const };

  const to = process.env.SUPPORT_INBOX;
  const from = process.env.SUPPORT_FROM_ADDRESS;
  const apiKey = process.env.LOVABLE_API_KEY;

  if (!to || !from || !apiKey) {
    return { sent: false, reason: "email_not_configured" as const, ticketId };
  }

  const body = `Category: ${ticket.category}\nFrom: ${ticket.contact_email ?? "unknown"}\n\n${ticket.message}`;

  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    await sendLovableEmail(
      {
        from,
        to,
        ...(ticket.contact_email ? { reply_to: ticket.contact_email } : {}),
        subject: `[Vaulta support] ${ticket.subject}`,
        text: body,
        html: `<h2>${ticket.subject}</h2><pre style="white-space:pre-wrap">${body}</pre>`,
      },
      { apiKey }
    );
    return { sent: true as const, ticketId: ticket.id };
  } catch (err) {
    console.error("[support] email send failed", err);
    return { sent: false, reason: "send_failed" as const, ticketId: ticket.id };
  }
}

export async function listMemberEmails() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email");

  if (error) throw error;
  return data ?? [];
}
  
