import { Prisma } from '@prisma/client'
import { assignmentSelectAll } from '.'

export const selectFetchClasses = Prisma.validator<Prisma.ClassArgs>()({
	select: {
		id: true,
		title: true,
		classNum: true,
		date: true,
		description: true,
		tags: {
			select: {
				id: true,
				tag: true,
				color: true,
			},
		},
		assignments: assignmentSelectAll,
		materialLinks: true,
		checkinTweet: true,
		vod: true,
		slidesUrl: true,
	},
})

export const querySingleClass = (classId) => {
	return Prisma.validator<Prisma.ClassFindUniqueOrThrowArgs>()({
		where: {
			id: classId,
		},
		select: {
			id: true,
			title: true,
			classNum: true,
			date: true,
			description: true,
			tags: {
				select: {
					id: true,
					tag: true,
					color: true,
				},
			},
			assignments: {
				select: {
					id: true,
					dateAssigned: true,
					dateDue: true,
					name: true,
					description: true,
					resources: true,
					tags: {
						select: {
							id: true,
							tag: true,
							color: true,
						},
					},
					submitUrl: true,
				},
			},
			materialLinks: true,
			checkinTweet: true,
			vod: true,
			slidesUrl: true,
		},
	})
}

export const upsertManyCompletedClassesPayload = (userId, classId) => {
	return Prisma.validator<Prisma.ClassStatusUpsertArgs>()({
		where: {
			classId_userId: {
				classId,
				userId,
			},
		},
		update: {
			status: 'done',
		},
		create: {
			userId,
			classId,
			status: 'done',
		},
	})
}
export const selectUserClassStatus =
	Prisma.validator<Prisma.ClassStatusSelect>()({
		classId: true,
		status: true,
		userId: true,
	})
export const queryClassStatusesByUser = (userId) => {
	return Prisma.validator<Prisma.ClassStatusFindManyArgs>()({
		where: {
			userId: { equals: userId },
		},
		select: selectUserClassStatus,
	})
}

export const upsertSingleClassStatus = (userId, classId, newStatus) => {
	return Prisma.validator<Prisma.ClassStatusUpsertArgs>()({
		where: {
			classId_userId: {
				userId,
				classId,
			},
		},
		update: {
			status: newStatus,
		},
		create: {
			userId,
			classId,
			status: newStatus,
		},
		select: selectUserClassStatus,
	})
}
