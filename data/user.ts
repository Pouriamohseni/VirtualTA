import { db } from "../lib/db"

export const getUserByEmail = async (email: string) => {
        const user = await db.user.findUnique({ where: { email } });

        return user;
};