// Daily motivational quotes database
const MOTIVATIONAL_QUOTES = [
  "Focus on being productive instead of busy. — Tim Ferriss",
  "The secret of getting ahead is getting started. — Mark Twain",
  "It is not that we have a short time to live, but that we waste a lot of it. — Seneca",
  "Your mind is for having ideas, not holding them. — David Allen",
  "Done is better than perfect. — Sheryl Sandberg",
  "Action is the foundational key to all success. — Pablo Picasso",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Determine never to be idle. No one will have occasion to complain of the want of time who never loses any. — Thomas Jefferson"
];

// @desc    Get AI suggestions for a potential task title
// @route   POST /api/v1/ai/suggest
// @access  Private
exports.getTaskSuggestions = async (req, res, next) => {
  try {
    const { title = '', description = '' } = req.body;

    const combinedText = `${title} ${description}`.toLowerCase();

    // 1. Detect priority
    let priority = 'Medium';
    const urgentKeywords = ['urgent', 'asap', 'broken', 'critical', 'crash', 'blocker', 'hotfix', 'fix immediately'];
    const highKeywords = ['important', 'priority', 'meeting', 'review', 'client', 'demo', 'milestone', 'launch'];
    const lowKeywords = ['optional', 'whenever', 'low priority', 'backlog', 'cleanup', 'refactor', 'documentation', 'draft'];

    if (urgentKeywords.some(kw => combinedText.includes(kw))) {
      priority = 'Urgent';
    } else if (highKeywords.some(kw => combinedText.includes(kw))) {
      priority = 'High';
    } else if (lowKeywords.some(kw => combinedText.includes(kw))) {
      priority = 'Low';
    }

    // 2. Recommend tags
    const suggestedTags = [];
    const tagMappings = {
      'frontend': ['css', 'html', 'react', 'tailwind', 'ui', 'ux', 'components', 'style', 'page', 'button', 'responsive', 'landing'],
      'backend': ['api', 'database', 'mongodb', 'express', 'node', 'server', 'routes', 'controllers', 'auth', 'jwt', 'security'],
      'marketing': ['seo', 'copy', 'social', 'campaign', 'ad', 'newsletter', 'email', 'lead', 'analytics'],
      'bug': ['fix', 'bug', 'error', 'fails', 'broken', 'issue', 'crash', 'patch'],
      'design': ['figma', 'mockup', 'wireframe', 'logo', 'colors', 'typography', 'vector', 'illustration'],
      'planning': ['roadmap', 'sprint', 'scrum', 'brainstorm', 'backlog', 'estimate']
    };

    for (const [tag, keywords] of Object.entries(tagMappings)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        suggestedTags.push(tag.toUpperCase());
      }
    }

    if (suggestedTags.length === 0) {
      suggestedTags.push('GENERAL');
    }

    // 3. Recommend category
    let category = 'Work';
    if (combinedText.includes('learn') || combinedText.includes('study') || combinedText.includes('course') || combinedText.includes('read')) {
      category = 'Study';
    } else if (combinedText.includes('workout') || combinedText.includes('gym') || combinedText.includes('run') || combinedText.includes('fitness')) {
      category = 'Fitness';
    } else if (combinedText.includes('buy') || combinedText.includes('shopping') || combinedText.includes('grocery') || combinedText.includes('store')) {
      category = 'Shopping';
    } else if (combinedText.includes('call') || combinedText.includes('meet') || combinedText.includes('sync') || combinedText.includes('discussion')) {
      category = 'Meetings';
    } else if (combinedText.includes('personal') || combinedText.includes('home') || combinedText.includes('house') || combinedText.includes('family')) {
      category = 'Personal';
    }

    // 4. Recommend Due Date
    let dueDate = null;
    const today = new Date();
    
    if (combinedText.includes('today')) {
      dueDate = today.toISOString();
    } else if (combinedText.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      dueDate = tomorrow.toISOString();
    } else if (combinedText.includes('next week') || combinedText.includes('in a week')) {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      dueDate = nextWeek.toISOString();
    } else if (combinedText.includes('end of week') || combinedText.includes('weekend')) {
      const eow = new Date();
      const currentDay = today.getDay();
      const distance = 5 - currentDay; // Distance to Friday
      eow.setDate(today.getDate() + (distance > 0 ? distance : 5));
      dueDate = eow.toISOString();
    }

    res.status(200).json({
      success: true,
      suggestions: {
        priority,
        tags: suggestedTags,
        category,
        dueDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily motivational quote
// @route   GET /api/v1/ai/quote
// @access  Public
exports.getMotivationalQuote = async (req, res, next) => {
  try {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    res.status(200).json({
      success: true,
      quote: MOTIVATIONAL_QUOTES[randomIndex]
    });
  } catch (error) {
    next(error);
  }
};
