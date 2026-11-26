import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from 'nodemailer';
import {
    MAX_CONTACT_MESSAGE_LENGTH,
    MAX_CONTACT_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    InputLimitError,
    assertLength,
    escapeHtml,
} from "@/lib/inputLimits";

export default async function handler(
    req: NextApiRequest, res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message )
        return res.status(404).json({ error: 'Missing resources'});

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid contact form fields." });
    }

    try {
        assertLength(name, MAX_CONTACT_NAME_LENGTH, "Name");
        assertLength(email, MAX_EMAIL_LENGTH, "Email");
        assertLength(message, MAX_CONTACT_MESSAGE_LENGTH, "Message");
    } catch (error: unknown) {
        if (error instanceof InputLimitError) {
            return res.status(error.status).json({ error: error.message });
        }
        throw error;
    }

    try {
        // Configure the nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        const headerName = name.replace(/[\r\n"]/g, "");
        const headerEmail = email.replace(/[\r\n]/g, "");
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

        // Define the email options
        const mailOptions = {
            from: `"${headerName}" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_FROM,
            replyTo: headerEmail,
            subject: `New message from ${headerName} via Omni Contact Form`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h1>New Contact Form Submission</h1>
                <p><strong>Name:</strong> ${safeName}</p>
                <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>${safeMessage}</p>
            `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Message sent!'})
    }
    catch (error: any) {
        return res.status(500).json({ error: 'Error in sending email!'})
    }
    
}