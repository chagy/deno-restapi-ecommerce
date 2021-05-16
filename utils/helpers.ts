import { config } from "../deps.ts";

const { SENDGRID_API_KEY } = config();
export const validateEmail = (email: string) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  return emailRegex.test(email);
};

export const sendEmail = async (
  toEmail: string,
  toName: string,
  subject: string,
  html: string,
  fromEmail: string = "chagy_x_@hotmail.com",
) => {
  const message = {
    personalizations: [{
      to: [{ email: toEmail, name: toName }],
      subject: subject,
    }],
    content: [{ type: "text/html", value: html }],
    from: { email: fromEmail, name: "Bunnason chagy" },
    reply_to: { email: "chagy@test.com", name: "Chagy" },
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  return response;
};
