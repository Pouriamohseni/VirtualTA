"use server";

import { getUserByEmail } from "../data/user";
import { generateTwoFactorToken } from "../lib/tokens";
import { sendTwoFactorTokenEmail } from "../lib/mail";
import { getTwoFactorConfirmationByUserId } from "../data/two-factor-confirmation";
import { getTwoFactorTokenByEmail } from "../data/two-factor-token";
import { compare } from 'bcrypt';
import { db } from '../lib/db'

export const login = async (values: any) => {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser.isTwoFactorEnabled && existingUser.email)
    {
        if (values.code) {
            const twoFactorToken = await getTwoFactorTokenByEmail(
                existingUser.email
            );

            if (!twoFactorToken) {
                return { error: "Invalid code!"}
            }

            if (twoFactorToken.token !== values.code) {
                return { error: "Invalid code!"};
            }

            const hasExpired = new Date(twoFactorToken.expires) < new Date();

            if (hasExpired) {
                return { error: "Code expired!"};
            }

            await db.twoFactorToken.delete({
                where: { id: twoFactorToken.id }
            });

            const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
            if (existingConfirmation) {
                await db.twoFactorConfirmation.delete({
                    where: { id: existingConfirmation.id}
                });
            }

            await db.twoFactorConfirmation.create({
                data: {
                    userId: existingUser.id,
                }
            });

        } else {
            const passwordMatch = await compare(values.password, existingUser.password);
            if (!passwordMatch) { return { error: "Invalid login" }; }
            const twoFactorToken = await generateTwoFactorToken(existingUser.email);
            await sendTwoFactorTokenEmail(
                twoFactorToken.email,
                twoFactorToken.token,
            );

            return { twoFactor: true }
        }
    }
}