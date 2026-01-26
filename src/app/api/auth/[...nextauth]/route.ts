// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Типизация authOptions
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Prisma нужен для пользователей
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // используем JWT вместо базы
    maxAge: 60 * 60 * 24 * 7, // 7 дней жизни токена
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET, // обязательно указать секрет
  },
  callbacks: {
    async jwt({ token, user }) {
      // при первом входе user приходит, добавляем id в токен
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // передаем id пользователя в сессию
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
