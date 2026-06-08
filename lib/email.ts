import { Resend } from "resend";

// Sends the admin-invite email. Best-effort: if RESEND_API_KEY isn't set or
// sending fails, we just log and move on — the in-app invite still works.
export async function sendAdminInviteEmail(toEmail: string, gymName: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // email not configured yet

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${appUrl}/admin/accept-invite`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Activa <onboarding@resend.dev>",
      to: toEmail,
      subject: `You've been invited to manage ${gymName} on Activa`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#0f172a;">You're invited to help run ${gymName} 🏋️</h2>
          <p style="color:#475569;">A gym administrator invited you to manage <strong>${gymName}</strong> on Activa.</p>
          <p style="color:#475569;">Click below, then sign up using <strong>this email address</strong> to create your administrator account:</p>
          <p style="margin:24px 0;">
            <a href="${acceptUrl}" style="background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Accept Invite →</a>
          </p>
          <p style="color:#94a3b8;font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }
}
