// ============================================
// Polling Utilities
// Kedai Sepijak Frontend
// ============================================

/**
 * Validate and normalize poll data structure
 */
export const normalizePollData = (poll) => {
  if (!poll || typeof poll !== 'object') {
    console.warn('⚠️ Invalid poll data:', poll);
    return null;
  }

  // Handle database-style structure
  const normalized = {
    id: poll.id || null,
    question: poll.question || '',
    description: poll.description || '',
    is_active: poll.is_active === 1 || poll.is_active === true, // Handle integer or boolean
    status: poll.status || 'draft',
    start_date: poll.start_date || null,
    end_date: poll.end_date || null,
    admin_id: poll.admin_id || poll.created_by || 1,
    created_at: poll.created_at || new Date().toISOString(),
    updated_at: poll.updated_at || poll.created_at || new Date().toISOString(),
    total_votes: Number(poll.total_votes) || 0,
    options: Array.isArray(poll.options) ? poll.options.map(normalizeOptionData).filter(Boolean) : []
  };

  // Calculate total votes from options if not provided or inconsistent
  const calculatedVotes = normalized.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  if (calculatedVotes > 0 && calculatedVotes !== normalized.total_votes) {
    normalized.total_votes = calculatedVotes;
    console.log('🔄 Updated total_votes from options sum:', calculatedVotes);
  }

  return normalized;
};

/**
 * Validate and normalize option data structure
 */
export const normalizeOptionData = (option) => {
  if (!option || typeof option !== 'object') {
    console.warn('⚠️ Invalid option data:', option);
    return null;
  }

  return {
    id: option.id || null,
    option_text: option.option_text || option.text || '',
    votes: Number(option.votes) || 0,
    poll_id: option.poll_id || option.polling_id || null, // Handle both field names
    created_at: option.created_at || new Date().toISOString(),
    updated_at: option.updated_at || option.created_at || new Date().toISOString()
  };
};

/**
 * Validate poll creation payload
 */
export const validatePollPayload = (payload) => {
  const errors = [];

  // Validate question
  if (!payload.question || typeof payload.question !== 'string') {
    errors.push('Question is required and must be a string');
  } else if (payload.question.trim().length < 5) {
    errors.push('Question must be at least 5 characters long');
  } else if (payload.question.trim().length > 500) {
    errors.push('Question must be less than 500 characters');
  }

  // Validate options
  if (!Array.isArray(payload.options)) {
    errors.push('Options must be an array');
  } else if (payload.options.length < 2) {
    errors.push('At least 2 options are required');
  } else if (payload.options.length > 10) {
    errors.push('Maximum 10 options allowed');
  } else {
    // Validate each option
    const validOptions = payload.options
      .map(opt => typeof opt === 'string' ? opt.trim() : '')
      .filter(Boolean);
    
    if (validOptions.length < 2) {
      errors.push('At least 2 valid options are required');
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(validOptions)];
    if (uniqueOptions.length !== validOptions.length) {
      errors.push('Duplicate options are not allowed');
    }

    // Check option length
    const longOptions = validOptions.filter(opt => opt.length > 200);
    if (longOptions.length > 0) {
      errors.push('Each option must be less than 200 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanPayload: errors.length === 0 ? {
      question: payload.question.trim(),
      options: payload.options
        .map(opt => typeof opt === 'string' ? opt.trim() : '')
        .filter(Boolean),
      is_active: Boolean(payload.is_active)
    } : null
  };
};

/**
 * Format poll data for display
 */
export const formatPollForDisplay = (poll) => {
  const normalized = normalizePollData(poll);
  if (!normalized) return null;

  return {
    ...normalized,
    statusText: normalized.is_active ? 'Aktif' : 'Nonaktif',
    statusClass: normalized.is_active ? 'text-green-600' : 'text-gray-500',
    createdAtFormatted: formatDate(normalized.created_at),
    totalVotesFormatted: normalized.total_votes.toLocaleString('id-ID'),
    optionsWithPercentage: normalized.options.map(option => ({
      ...option,
      percentage: normalized.total_votes > 0 
        ? Math.round((option.votes / normalized.total_votes) * 100)
        : 0,
      votesFormatted: option.votes.toLocaleString('id-ID')
    }))
  };
};

/**
 * Format date for Indonesian locale
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tanggal tidak valid';

    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } else if (days > 0) {
      return `${days} hari lalu`;
    } else if (hours > 0) {
      return `${hours} jam lalu`;
    } else {
      return 'Baru saja';
    }
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Tanggal tidak valid';
  }
};

/**
 * Check if poll is active based on various status indicators
 */
export const isPollActive = (poll) => {
  if (!poll) return false;
  
  // Check explicit active status
  if (poll.status === 'active') return true;
  if (poll.is_active === true || poll.is_active === 1) return true;
  
  // Check explicit inactive status
  if (poll.status === 'inactive' || poll.status === 'closed' || poll.status === 'completed') return false;
  if (poll.is_active === false || poll.is_active === 0) return false;
  
  // Default to false for safety
  return false;
};

/**
 * Generate sample poll data for testing
 */
export const generateSamplePoll = () => {
  return {
    id: Date.now(),
    question: 'Menu favorit Anda di Kedai Sepijak?',
    is_active: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_votes: 0,
    options: [
      {
        id: Date.now() + 1,
        option_text: 'Kopi Sepijak Special',
        votes: 0,
        poll_id: Date.now()
      },
      {
        id: Date.now() + 2,
        option_text: 'Nasi Gudeg Jogja',
        votes: 0,
        poll_id: Date.now()
      }
    ]
  };
};

export default {
  normalizePollData,
  normalizeOptionData,
  validatePollPayload,
  formatPollForDisplay,
  isPollActive,
  generateSamplePoll
};
