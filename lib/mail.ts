import { Resend } from "resend";

const resend = new Resend('re_dGSzoLKs_A61zn5d6gxNF4Fjst19wkL1y');

export const sendTwoFactorTokenEmail = async (
    email: string,
    token: string
) => {
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "2FA Code",
        html: `<p> Your 2FA code: ${token}</p>`
    });
};