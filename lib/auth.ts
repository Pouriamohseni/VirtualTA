import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from "./db";
import { compare } from "bcrypt";
import { getTwoFactorConfirmationByUserId } from "../data/two-factor-confirmation";
import { getUserByEmail } from "../data/user";
import { auth } from "@clerk/nextjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/sign-in',
    }, 
    providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            email: { label: "Email", type: "email", placeholder: "jsmith@mail.com" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if (!credentials?.email || !credentials?.password){
                return null;
            }
            
            const existingUser = await getUserByEmail(credentials?.email);
            if(!existingUser){
                return null;
            }

            const passwordMatch = await compare(credentials.password, 
            existingUser.password);

            if(!passwordMatch){
                return null;
            }
            
            return {
                id: `${existingUser.id}`,
                username: existingUser.username,
                email: existingUser.email
            }
          }
        })
      ],
      callbacks: {
        async signIn({ user, account }) {
            const existingUser = await getUserByEmail(user.email);

            
            if (existingUser.isTwoFactorEnabled)
            {
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

                if (!twoFactorConfirmation) return false;

                await db.twoFactorConfirmation.delete({
                    where: { id: twoFactorConfirmation.id}
                });
            }

            return true;
        },
        async jwt({ token, user}) {
            if(user){
                return{
                    ...token,
                    username: user.username
                }
            }
            return token;
        },
        async session({ session, token }) {
            return{
                ...session,
                user: {
                    ...session.user,
                    username: token.username
                }
            }
        },

      }

}

export const getUserId = async () => {
    const session = await auth();

    return session?.user;
}