import { NextApiHandler } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import DiscordProvider from 'next-auth/providers/discord'
import prisma from '~/lib/prisma'
import axios from 'axios'
import type { User, Account } from 'next-auth'

const authHandler: NextApiHandler = (req, res) =>
	NextAuth(req, res, authOptions)
export default authHandler

/**
 * It checks if the user is a member of the server
 * @param {Account} account - Account - This is the account object that is returned from the login
 * function.
 * @returns A boolean value
 */
const isServerMember = async (account: Account) => {
	const guildId = '735923219315425401'

	const guilds = await axios.get(
		'https://discord.com/api/v10/users/@me/guilds',
		{
			headers: {
				Authorization: `Bearer ${account.access_token}`,
			},
		}
	)
	if (
		guilds?.data.some((guild) => {
			if (guild.id === guildId) return true
		})
	) {
		return true
	}
	return false
}

/**
 * It updates the user's serverMember field to the value of the isServerMember parameter
 * @param {User} user - User - The user object that we're updating
 * @param {boolean} isServerMember - boolean - This is a boolean that determines whether the user is a
 * server member or not.
 */
const updateServerMember = async (user: User, isServerMember: boolean) => {
	const { id } = user
	await prisma.user.update({
		where: {
			id,
		},
		data: {
			serverMember: isServerMember,
		},
	})
}

const authOptions: NextAuthOptions = {
	providers: [
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
			authorization:
				'https://discord.com/api/oauth2/authorize?scope=identify+email+guilds+guilds.members.read',
			profile(profile) {
				if (profile.avatar === null) {
					const defaultAvatarNumber = parseInt(profile.discriminator) % 5
					profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
				} else {
					const format = profile.avatar.startsWith('a_') ? 'gif' : 'png'
					profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
				}
				return {
					id: profile.id,
					name: `${profile.username}#${profile.discriminator}`,
					email: profile.email,
					image: profile.image_url,
				}
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			// Is the account disabled? Get out of here!
			if (user.userDisabled) return false
			// 100Devs Discord server member? proceed!
			if (user.serverMember) return true
			// check to see if user is a member of the discord server & update status if they are
			const serverMember = await isServerMember(account)
			if (isServerMember) {
				updateServerMember(user, serverMember)
				return true
			}
			// nope, get out.
			return false
		},
		async session({ session, user }) {
			const { access_token } = await prisma.account.findFirst({
				where: {
					userId: user.id,
				},
				select: {
					access_token: true,
				},
			})
			session.bearerToken = access_token
			return session
		},
	},
	adapter: PrismaAdapter(prisma),
	secret: process.env.SECRET,
}
