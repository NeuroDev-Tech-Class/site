import { html } from '../lib/html.js';
import { formatName } from '../lib/format.js';

const wrapper = body => html`
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;">
    ${body}
  </div>
`;

export function approvalMailDoc(student, siteUrl) {
  const body = html`
    <h2 style="color:#44aadd;margin-top:0;">Welcome to NeuroDev, ${formatName(student.firstName)}!</h2>
    <p>Great news — your account has been approved. You can now log in and access your student dashboard to track your course progress and certificates.</p>
    <a href="${siteUrl}profile.html"
       style="display:inline-block;background:#44aadd;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
      Go to My Dashboard
    </a>
    <p style="color:#666;font-size:0.9rem;">If you have any questions, feel free to reach out to your tech coach.</p>
    <p style="color:#666;font-size:0.9rem;">— The NeuroDev Team</p>
  `;
  return {
    to: student.email,
    message: {
      subject: 'Your NeuroDev Account Has Been Approved!',
      html: String(wrapper(body))
    }
  };
}

export function certificateMailDoc(student, courseName, attachment) {
  const body = html`
    <h2 style="color:#44aadd;margin-top:0;">Congratulations, ${formatName(student.firstName)}!</h2>
    <p>You've earned a certificate of completion for <strong>${courseName}</strong>.</p>
    <p>Your certificate is attached to this email. You can save or print it for your records.</p>
    <p style="color:#666;font-size:0.9rem;">Keep up the great work — The NeuroDev Team</p>
  `;
  return {
    to: student.email,
    message: {
      subject: `Your NeuroDev Certificate — ${courseName}`,
      html: String(wrapper(body)),
      attachments: [{ filename: attachment.filename, content: attachment.content, encoding: 'base64' }]
    }
  };
}

export function mailRepo(fs) {
  const { db, collection, addDoc } = fs;
  const mail = () => collection(db, 'mail');

  return {
    queueApproval: (student, siteUrl) => addDoc(mail(), approvalMailDoc(student, siteUrl)),
    queueCertificate: (student, courseName, attachment) =>
      addDoc(mail(), certificateMailDoc(student, courseName, attachment))
  };
}
