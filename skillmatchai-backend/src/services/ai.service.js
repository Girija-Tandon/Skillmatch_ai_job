// src/services/ai.service.js — AI with smart fallbacks (no OpenAI needed for basic features)
const logger = require('../utils/logger');

let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-openai')) {
    try {
      const OpenAI = require('openai');
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      logger.info('✅ OpenAI client initialized');
    } catch (e) { logger.warn('OpenAI init failed:', e.message); }
  }
  return openai;
};

const MODEL = 'gpt-4-turbo-preview';

const safeJSON = (text, fallback = {}) => {
  try { return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim()); }
  catch { return fallback; }
};

// ── 1. Certificate Validation ─────────────────────────────────────────────────
exports.validateCertificateWithAI = async (extractedText, filename = '') => {
  const ai = getOpenAI();
  if (ai) {
    try {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: `Analyze this certificate text and return ONLY JSON (no markdown):
{"isValid":boolean,"confidence":number 0-100,"skills":["skill1"],"issuer":"org","courseName":"name","reason":"explanation"}

Text: ${extractedText.substring(0, 3000)}` }],
        response_format: { type: 'json_object' },
        temperature: 0.1, max_tokens: 500,
      });
      return safeJSON(response.choices[0].message.content, { isValid: false, confidence: 0, skills: [] });
    } catch (err) { logger.warn('OpenAI cert validation failed:', err.message); }
  }

  // ── Smart fallback: analyze text content without AI ──────────────────────
  const text  = (extractedText + ' ' + filename).toLowerCase();
  const certKeywords = ['certificate','certified','certification','awarded','completed','course','training',
    'achievement','diploma','degree','credential','workshop','bootcamp','nanodegree','completion'];
  const issuerKeywords = ['coursera','udemy','google','microsoft','aws','cisco','oracle','linkedin',
    'nptel','udacity','edx','mit','stanford','harvard','iit','nasscom','infosys'];

  const hasCertWord = certKeywords.some(k => text.includes(k));
  const hasIssuer   = issuerKeywords.some(k => text.includes(k));
  const confidence  = hasCertWord ? (hasIssuer ? 85 : 65) : 20;
  const isValid     = confidence >= 60;

  // Extract skills from text
  const skillPatterns = ['python','javascript','react','node','java','sql','excel','tableau','power bi',
    'machine learning','deep learning','tensorflow','keras','pandas','numpy','docker','aws','azure',
    'kubernetes','git','html','css','typescript','mongodb','postgresql','data analysis','statistics'];
  const skills = skillPatterns.filter(s => text.includes(s));

  // Guess issuer
  const issuer = issuerKeywords.find(k => text.includes(k)) || 'Unknown Issuer';
  const courseName = filename.replace(/\.(pdf|jpg|png|jpeg|webp)$/i,'').replace(/[-_]/g,' ') || 'Certificate';

  logger.info(`[fallback] cert validation: isValid=${isValid}, confidence=${confidence}`);
  return { isValid, confidence, skills, issuer, courseName,
    reason: hasCertWord ? 'Certificate keywords found in document' : 'Could not confirm certificate authenticity' };
};

// ── 2. Generate Verification Test ────────────────────────────────────────────
exports.generateVerificationTest = async (skills = [], courseName = '') => {
  const ai = getOpenAI();
  if (ai) {
    try {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: `Generate 5 MCQ questions to verify knowledge in: ${skills.join(', ')} (${courseName}).
Return ONLY JSON: {"questions":[{"id":"q1","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct_answer":"A","difficulty":"easy"}]}` }],
        response_format: { type: 'json_object' },
        temperature: 0.5, max_tokens: 1500,
      });
      return safeJSON(response.choices[0].message.content, { questions: [] });
    } catch (err) { logger.warn('OpenAI test gen failed:', err.message); }
  }

  // Fallback questions based on skills
  const skill = skills[0] || 'programming';
  return {
    questions: [
      { id:'q1', question:`What is the primary purpose of ${skill}?`, difficulty:'easy',
        options:{A:`To build applications`,B:`To manage hardware`,C:`To design UI only`,D:`None of the above`}, correct_answer:'A' },
      { id:'q2', question:`Which of the following is a best practice in ${skill}?`, difficulty:'medium',
        options:{A:`Writing clean, documented code`,B:`Ignoring errors`,C:`Hardcoding values`,D:`Skipping testing`}, correct_answer:'A' },
      { id:'q3', question:`What does debugging mean in ${skill}?`, difficulty:'easy',
        options:{A:`Finding and fixing errors`,B:`Writing new features`,C:`Deploying code`,D:`Reviewing design`}, correct_answer:'A' },
      { id:'q4', question:`How would you optimize performance in a ${skill} application?`, difficulty:'hard',
        options:{A:`Profile first, then optimize bottlenecks`,B:`Rewrite everything`,C:`Add more servers`,D:`Reduce features`}, correct_answer:'A' },
      { id:'q5', question:`What is version control important for in ${skill} projects?`, difficulty:'medium',
        options:{A:`Tracking changes and collaborating`,B:`Running code faster`,C:`Fixing UI bugs`,D:`Database management`}, correct_answer:'A' },
    ]
  };
};

// ── 3. Interview Questions ────────────────────────────────────────────────────
exports.generateInterviewQuestions = async (skills = [], targetRole = 'Software Developer') => {
  const ai = getOpenAI();
  if (ai) {
    try {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: `Generate 5 technical interview questions for "${targetRole}". Candidate skills: ${skills.join(', ') || 'general'}.
Mix: 2 easy, 2 medium, 1 hard. Open-ended questions only.
Return ONLY JSON: {"questions":[{"id":"q1","question":"...","difficulty":"easy","topic":"React","expectedKeyPoints":["point1","point2"]}]}` }],
        response_format: { type: 'json_object' },
        temperature: 0.7, max_tokens: 1500,
      });
      return safeJSON(response.choices[0].message.content, { questions: [] });
    } catch (err) { logger.warn('OpenAI interview gen failed:', err.message); }
  }

  // Role-specific fallback questions
  const roleQuestions = {
    'data analyst': [
      { id:'q1', question:'What is the difference between mean, median, and mode? When would you use each?', difficulty:'easy', topic:'Statistics', expectedKeyPoints:['mean is average','median is middle value','mode is most frequent','median better for skewed data'] },
      { id:'q2', question:'Explain how you would clean a dataset with missing values and outliers.', difficulty:'medium', topic:'Data Cleaning', expectedKeyPoints:['identify missing values','imputation strategies','IQR for outliers','domain knowledge'] },
      { id:'q3', question:'What is SQL and write a query to find the top 5 customers by revenue.', difficulty:'medium', topic:'SQL', expectedKeyPoints:['SELECT','ORDER BY','LIMIT','SUM or COUNT','GROUP BY'] },
      { id:'q4', question:'Explain the difference between supervised and unsupervised learning with examples.', difficulty:'hard', topic:'Machine Learning', expectedKeyPoints:['supervised has labels','unsupervised finds patterns','classification regression','clustering examples'] },
      { id:'q5', question:'How do you communicate data insights to a non-technical stakeholder?', difficulty:'easy', topic:'Communication', expectedKeyPoints:['avoid jargon','use visuals','focus on business impact','tell a story'] },
    ],
    'default': [
      { id:'q1', question:`Explain the core principles of ${targetRole} development and your experience.`, difficulty:'easy', topic:'General', expectedKeyPoints:['relevant experience','core concepts','tools used'] },
      { id:'q2', question:'Describe the most challenging technical problem you solved. What was your approach?', difficulty:'medium', topic:'Problem Solving', expectedKeyPoints:['problem identification','research','solution','outcome','lessons learned'] },
      { id:'q3', question:'How do you ensure code quality and maintainability in your projects?', difficulty:'easy', topic:'Best Practices', expectedKeyPoints:['testing','code review','documentation','clean code','version control'] },
      { id:'q4', question:'How would you design and optimize a slow-performing application?', difficulty:'medium', topic:'Performance', expectedKeyPoints:['profiling','identify bottleneck','caching','database optimization','monitoring'] },
      { id:'q5', question:'Describe the system design for a scalable real-time notification system.', difficulty:'hard', topic:'System Design', expectedKeyPoints:['WebSockets or SSE','message queue','horizontal scaling','database','reliability'] },
    ]
  };

  const role = targetRole.toLowerCase();
  const questions = Object.keys(roleQuestions).find(k => role.includes(k))
    ? roleQuestions[Object.keys(roleQuestions).find(k => role.includes(k))]
    : roleQuestions.default;

  return { questions };
};

// ── 4. Evaluate Interview Answer — REAL SCORING based on keywords ─────────────
exports.evaluateInterviewAnswer = async (question, expectedKeyPoints = [], candidateAnswer) => {
  const ai = getOpenAI();
  if (ai) {
    try {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: `You are a strict technical interviewer. Evaluate this answer honestly.

Question: ${question}
Expected key points: ${expectedKeyPoints.join(', ')}
Candidate answer: ${candidateAnswer}

SCORING RULES:
- 9-10: Covers ALL key points with depth and examples
- 7-8: Covers most key points clearly
- 5-6: Covers some key points, missing important ones
- 3-4: Vague or mostly incorrect
- 1-2: Off-topic or completely wrong
- If answer is only 1-2 words or nonsense, score 1-2

Return ONLY JSON:
{"score":number,"feedback":"2-3 sentences","coveredPoints":["..."],"missedPoints":["..."],"suggestion":"one improvement tip"}` }],
        response_format: { type: 'json_object' },
        temperature: 0.3, max_tokens: 600,
      });
      return safeJSON(response.choices[0].message.content, { score: 5, feedback: 'Answer received.', coveredPoints: [], missedPoints: [] });
    } catch (err) { logger.warn('OpenAI evaluation failed:', err.message); }
  }

  // ── Smart fallback: score based on keyword matching ──────────────────────
  const answer = (candidateAnswer || '').toLowerCase().trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  // If answer is too short or nonsensical, give low score
  if (wordCount < 5) {
    return {
      score: 2,
      feedback: 'Your answer was too brief to evaluate properly. Please provide a detailed response.',
      coveredPoints: [],
      missedPoints: expectedKeyPoints,
      suggestion: 'Aim for at least 3-4 sentences explaining your understanding with an example.',
    };
  }

  // Count how many key points are mentioned (keyword matching)
  const covered = expectedKeyPoints.filter(point =>
    point.toLowerCase().split(' ').some(word => word.length > 3 && answer.includes(word))
  );
  const missed = expectedKeyPoints.filter(p => !covered.includes(p));

  // Score based on coverage + answer length
  const coverageRatio = expectedKeyPoints.length > 0 ? covered.length / expectedKeyPoints.length : 0;
  const lengthBonus   = wordCount > 50 ? 1 : wordCount > 25 ? 0.5 : 0;
  const rawScore      = coverageRatio * 7 + lengthBonus + 1.5;
  const score         = Math.min(10, Math.max(1, Math.round(rawScore)));

  const feedbacks = {
    high:   'Good answer! You covered the main concepts clearly.',
    medium: 'Decent attempt, but some important points were missing.',
    low:    'Your answer needs more depth. Review the key concepts for this topic.',
  };

  return {
    score,
    feedback: score >= 7 ? feedbacks.high : score >= 4 ? feedbacks.medium : feedbacks.low,
    coveredPoints: covered,
    missedPoints:  missed,
    suggestion: missed.length > 0
      ? `Try to also cover: ${missed.slice(0,2).join(' and ')}`
      : 'Good coverage — add real-world examples to make your answer stronger.',
  };
};

// ── 5. Skill Gap Analysis ─────────────────────────────────────────────────────
exports.analyzeSkillGap = async (userSkills = [], targetRole = 'Software Developer') => {
  const ai = getOpenAI();
  if (ai) {
    try {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: `Analyze skill gap for "${targetRole}".
User skills: ${userSkills.join(', ')}
Return ONLY JSON: {"strongSkills":["..."],"missingSkills":["..."],"readinessScore":number,"summary":"...","courses":[{"title":"...","platform":"Coursera","url":"https://coursera.org","free":true,"duration":"4 weeks"}]}` }],
        response_format: { type: 'json_object' },
        temperature: 0.3, max_tokens: 1000,
      });
      return safeJSON(response.choices[0].message.content, {});
    } catch (err) { logger.warn('OpenAI skill gap failed:', err.message); }
  }

  // Smart fallback — role-specific skill requirements
  const roleSkills = {
    'data analyst':         ['SQL','Excel','Python','Tableau','Power BI','Statistics','Data Visualization','Pandas'],
    'data scientist':       ['Python','Machine Learning','TensorFlow','Statistics','SQL','Pandas','Scikit-learn','Deep Learning'],
    'full stack developer': ['React','Node.js','JavaScript','MongoDB','PostgreSQL','REST API','Docker','Git'],
    'frontend engineer':    ['React','TypeScript','CSS','JavaScript','Tailwind','HTML','Figma','Testing'],
    'backend developer':    ['Node.js','Python','Java','PostgreSQL','Redis','Docker','REST API','Microservices'],
    'devops engineer':      ['Docker','Kubernetes','AWS','CI/CD','Linux','Terraform','Ansible','Monitoring'],
  };

  const role = targetRole.toLowerCase();
  const required = Object.keys(roleSkills).find(k => role.includes(k))
    ? roleSkills[Object.keys(roleSkills).find(k => role.includes(k))]
    : ['JavaScript','Python','SQL','Git','Docker','REST API','Communication','Problem Solving'];

  const userLower   = userSkills.map(s => s.toLowerCase());
  const strongSkills  = userSkills.filter(s => required.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())));
  const missingSkills = required.filter(r => !userLower.some(s => s.includes(r.toLowerCase()) || r.toLowerCase().includes(s)));

  const readinessScore = required.length > 0
    ? Math.round((strongSkills.length / required.length) * 100)
    : 50;

  const courseMap = {
    'SQL':        { title:'SQL for Data Analysis', platform:'Coursera', url:'https://coursera.org/learn/sql-for-data-science', free:true, duration:'4 weeks' },
    'Python':     { title:'Python for Everybody', platform:'Coursera', url:'https://coursera.org/specializations/python', free:true, duration:'8 weeks' },
    'Excel':      { title:'Excel Skills for Business', platform:'Coursera', url:'https://coursera.org/specializations/excel', free:true, duration:'6 weeks' },
    'Tableau':    { title:'Tableau for Beginners', platform:'Udemy', url:'https://udemy.com/course/tableau-for-beginners', free:false, duration:'5 hours' },
    'Power BI':   { title:'Microsoft Power BI Desktop', platform:'Udemy', url:'https://udemy.com/course/microsoft-power-bi-up-running-with-power-bi-desktop', free:false, duration:'8 hours' },
    'React':      { title:'React - The Complete Guide', platform:'Udemy', url:'https://udemy.com/course/react-the-complete-guide-incl-redux', free:false, duration:'40 hours' },
    'Docker':     { title:'Docker & Kubernetes: The Practical Guide', platform:'Udemy', url:'https://udemy.com/course/docker-kubernetes-the-practical-guide', free:false, duration:'23 hours' },
    'Machine Learning': { title:'Machine Learning Specialization', platform:'Coursera', url:'https://coursera.org/specializations/machine-learning-introduction', free:true, duration:'3 months' },
    'Statistics': { title:'Statistics with Python', platform:'Coursera', url:'https://coursera.org/specializations/statistics-with-python', free:true, duration:'5 months' },
    'AWS':        { title:'AWS Fundamentals', platform:'Coursera', url:'https://coursera.org/specializations/aws-fundamentals', free:true, duration:'4 months' },
  };

  const courses = missingSkills.slice(0, 4).map(skill => {
    const key = Object.keys(courseMap).find(k => skill.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(skill.toLowerCase()));
    return key ? courseMap[key] : {
      title: `Learn ${skill}`, platform: 'YouTube',
      url: `https://youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial')}`,
      free: true, duration: 'Self-paced',
    };
  });

  const summary = strongSkills.length > 0
    ? `Good foundation with ${strongSkills.slice(0,2).join(' and ')}. ${missingSkills.length > 0 ? `Focus on learning ${missingSkills.slice(0,2).join(' and ')} to become job-ready.` : 'Great match for this role!'}`
    : `Start building skills in ${required.slice(0,3).join(', ')} to break into ${targetRole}.`;

  return { strongSkills, missingSkills, readinessScore, summary, courses, targetRole };
};
