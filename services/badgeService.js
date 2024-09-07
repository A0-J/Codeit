// services/badgeService.js

export const checkAndAssignBadges = async (group) => {
    const badges = [];

    // Check if `group` is an object and contains the necessary properties
    if (!group || typeof group !== 'object') {
        console.error('Invalid group data');
        return badges;
    }

    // Initialize group properties if they are undefined
    const memories = group.memories || [];
    const memoryStreak = group.memoryStreak || 0;
    const spaceReceived = group.spaceReceived || 0;
    const likeCount = group.likeCount || 0;

    // Example badge conditions
    if (Array.isArray(memories) && memories.length >= 20) {
        badges.push('memory-count-20');
    }

    if (memoryStreak >= 7) {
        badges.push('memory-streak-7');
    }

    if (spaceReceived >= 10000) {
        badges.push('space-received-10000');
    }

    if (likeCount >= 10000) {
        badges.push('like-count-10000');
    }

    // Add additional badge conditions as needed

    return badges;
};
