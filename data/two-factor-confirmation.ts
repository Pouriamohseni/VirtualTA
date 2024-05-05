import { db } from '../lib/db'

export const getTwoFactorConfirmationByUserId = async (
    userId: number
) => {
    try {
        const twoFactorConfirmation = await db.twoFactorConfirmation.findUnique({
            where: { userId }
        });

        return twoFactorConfirmation;
    } catch {
        return null;
    }
}