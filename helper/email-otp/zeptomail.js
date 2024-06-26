import { SendMailClient } from "zeptomail";
import { emailDefaultOtpTemplate } from "../email-template.js";
import { config } from 'dotenv';
config();
const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_MAIL_TOKEN || "";
let client = new SendMailClient({ url, token });
async function sendEmail(email, name, subjectBody, htmlBody) {
    client.sendMail({
        "from": {
            "address": "no-reply@gecspectrum.com",
            "name": "GEC Spectrum 2024"
        },
        "to": [
            {
                "email_address": {
                    "address": `${email}`,
                    "name": `${name}`
                }
            }
        ],
        "subject": subjectBody,
        "htmlbody": htmlBody,
    }).then((resp) => console.log("success")).catch((error) => console.log("email sender error"));
}
// while sending an OTP a message can be added, if custom is true it will not use the default template and use whatever you provide
async function sendOtpEmail(email, otp = '', name = "", message = "", subject = '', custom = false) {
    if (custom) {
        const subjectBody = subject;
        const htmlBody = message;
        sendEmail(email, name, subjectBody, htmlBody);
    }
    else {
        const subjectBody = emailDefaultOtpTemplate(name, otp, message).subjectBody;
        const htmlBody = emailDefaultOtpTemplate(name, otp, message).htmlBody;
        sendEmail(email, name, subjectBody, htmlBody);
    }
}
//if (import.meta.url === `file://${process.argv[1]}`) { // will only run when the file is individually executed, not when imported
//sendOtpEmail("codersclub.gec@gmail.com", "123456", "GEC Coders");
// Test code
//console.log("Hello World")
//}
export { sendOtpEmail };
