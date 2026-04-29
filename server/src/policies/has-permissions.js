export default (policyContext, config, { strapi }) => {
	const { userAbility, user } = policyContext.state
	const { action, actions } = config
	if (!user || !userAbility) {
		return false
	}
	const actionsToCheck = actions || [action]
	if (!actionsToCheck) {
		return false
	}
	for (const actionToCheck of actionsToCheck) {
		const canAccess = userAbility.can(actionToCheck)
		if (canAccess) {
			return true
		}
	}
	return false
}
