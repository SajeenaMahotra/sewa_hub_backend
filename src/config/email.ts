import nodemailer from 'nodemailer';
const EMAIL_PASS=process.env.EMAIL_PASS as string;
const EMAIL_USER=process.env.EMAIL_USER as string;

// Add this check
console.log('Email Config:', {
    user: EMAIL_USER,
    passLength: EMAIL_PASS?.length,
    passPreview: EMAIL_PASS?.substring(0, 4) + '****'
});

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    const mailOptions = {
        from: `Sewa Hub <${EMAIL_USER}>`,
        to,
        subject,
        html,
    };
    await transporter.sendMail(mailOptions);
}