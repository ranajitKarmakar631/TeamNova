import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'chandler.macejkovic@ethereal.email',
        pass: 'tGJcQpYsj69JVnRxVa'
    }
});

export const sendEmail = async (email:string) => {
  const info = await transporter.sendMail({
    from: `"Your Name" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "This is a Subject",
    text: "Greetings from the team.",
    html: `
      <h1>Greetings from the team</h1>
      <p>You got this message through Nodemailer.</p>
    `,
  });

  console.log("Email sent:", info.messageId);
};