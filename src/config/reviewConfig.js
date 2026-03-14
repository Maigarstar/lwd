// Review system configuration
// Defines sub-rating categories per entity type and event types

export const SUB_RATING_KEYS = {
  venue:   ['setting', 'service', 'food', 'value'],
  planner: ['planning', 'communication', 'creativity', 'execution', 'value'],
  vendor:  ['quality', 'communication', 'professionalism', 'value'],
};

export const SUB_RATING_LABELS = {
  venue: {
    setting:      'Setting & Atmosphere',
    service:      'Service & Hospitality',
    food:         'Food & Catering',
    value:        'Value for Money',
  },
  planner: {
    planning:     'Planning & Organization',
    communication: 'Communication',
    creativity:   'Creativity & Innovation',
    execution:    'Execution',
    value:        'Value for Money',
  },
  vendor: {
    quality:      'Quality of Work',
    communication: 'Communication',
    professionalism: 'Professionalism',
    value:        'Value for Money',
  },
};

export const EVENT_TYPES = [
  'Wedding',
  'Elopement',
  'Micro Wedding',
  'Engagement Party',
  'Rehearsal Dinner',
  'Honeymoon',
  'Vow Renewal',
  'Other',
];

export const MODERATION_STATUSES = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};
