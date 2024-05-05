'use server';

import { getServerSession } from 'next-auth';
import { hash, compare } from 'bcrypt';
import { db } from '../../../lib/db';
import { authOptions } from '../../../lib/auth';


export const changePass = async (values : any) => {
    const session = await getServerSession(authOptions);

    const { oldPassword, newPassword } = values;

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const isPasswordValid = await compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return ("Incorrect old password");
    }

    const hashedPassword = await hash(newPassword, 10);

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return ("Password updated successfully");
}
