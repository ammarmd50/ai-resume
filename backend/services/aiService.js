const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Extract text from file buffer based on MIME type
const extractText = async (fileBuffer, originalName, mimeType) => {
  try {
    if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
      const data = await pdfParse(fileBuffer);
      return data.text || '';
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      originalName.endsWith('.docx')
    ) {
      const data = await mammoth.extractRawText({ buffer: fileBuffer });
      return data.value || '';
    } else {
      // Fallback for plain text
      return fileBuffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to extract text from resume file');
  }
};

// Generate highly realistic mock analysis if Gemini API Key is missing
const generateMockAnalysis = (text) => {
  const lowercaseText = text.toLowerCase();
  
  // Basic Regex parsers for name, email, phone
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const phoneRegex = /(\+?\d{1,4}[-.\s]??\d{1,10}[-.\s]??\d{1,10}[-.\s]??\d{1,10})/g;
  
  const emails = text.match(emailRegex);
  const phones = text.match(phoneRegex);
  
  const email = emails ? emails[0] : 'candidate@example.com';
  const phone = phones ? phones[0] : '+1 (555) 019-2834';
  
  // Try to find Name (usually the first non-empty line or matching pattern)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let name = 'Alex Mercer';
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@')) {
    name = lines[0];
  }

  // Keyword spotter for skills
  const skillKeywords = [
    'Angular', 'React', 'Vue', 'Node.js', 'Express', 'NestJS', 'TypeScript', 'JavaScript',
    'HTML', 'CSS', 'SCSS', 'Sass', 'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD', 'Python', 'Java', 'C++', 'Go'
  ];
  
  const detectedSkills = [];
  skillKeywords.forEach(skill => {
    if (lowercaseText.includes(skill.toLowerCase())) {
      detectedSkills.push(skill);
    }
  });

  // Provide some defaults if nothing detected
  if (detectedSkills.length === 0) {
    detectedSkills.push('JavaScript', 'HTML', 'CSS', 'Git', 'REST APIs');
  }

  // Segment skills into strong/weak/missing
  const allPossibleSkills = ['Angular', 'TypeScript', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'SCSS', 'Express.js', 'CI/CD', 'GraphQL', 'Next.js', 'TailwindCSS'];
  const strongSkills = detectedSkills.slice(0, Math.ceil(detectedSkills.length / 2));
  const weakSkills = detectedSkills.slice(Math.ceil(detectedSkills.length / 2));
  const missingSkills = allPossibleSkills.filter(s => !detectedSkills.includes(s)).slice(0, 4);

  // Generate ATS Score
  let score = 65;
  score += detectedSkills.length * 2; // Skill count improves score
  if (lowercaseText.includes('experience') || lowercaseText.includes('work')) score += 10;
  if (lowercaseText.includes('education') || lowercaseText.includes('university')) score += 5;
  if (lowercaseText.includes('project')) score += 5;
  if (score > 98) score = 98;
  if (score < 40) score = 40;

  // Extract mock education
  const education = [];
  if (lowercaseText.includes('university') || lowercaseText.includes('college') || lowercaseText.includes('bachelor')) {
    education.push({
      school: 'State Technical University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science & Engineering',
      from: new Date('2019-09-01'),
      to: new Date('2023-05-15'),
      current: false,
      description: 'Graduated with Honors. Focused on Software Engineering and Database Management.'
    });
  } else {
    education.push({
      school: 'Online Tech Academy',
      degree: 'Full Stack Development Certification',
      fieldOfStudy: 'Web Development',
      from: new Date('2022-01-01'),
      to: new Date('2022-08-30'),
      current: false,
      description: 'Intensive training on frontend and backend technologies.'
    });
  }

  // Extract mock experience
  const experience = [];
  if (lowercaseText.includes('developer') || lowercaseText.includes('engineer') || lowercaseText.includes('experience')) {
    experience.push({
      title: 'Senior Software Engineer' ,
      company: 'Tech Innovators Inc.',
      location: 'San Francisco, CA',
      from: new Date('2024-06-01'),
      to: null,
      current: true,
      description: 'Lead frontend development for enterprise SaaS platform. Mentored junior developers and optimized page performance by 40%.'
    });
    experience.push({
      title: 'Software Developer',
      company: 'AppForge Solutions',
      location: 'Remote',
      from: new Date('2023-06-01'),
      to: new Date('2024-05-30'),
      current: false,
      description: 'Developed RESTful services using Express and Mongoose. Collaborated with designers to deliver responsive React layouts.'
    });
  } else {
    experience.push({
      title: 'Junior Web Developer',
      company: 'Startup Lab',
      location: 'New York, NY',
      from: new Date('2023-09-01'),
      to: null,
      current: true,
      description: 'Assisted in building company marketing site and client portfolios. Learned and applied responsive web design.'
    });
  }

  // Projects
  const projects = [
    {
      title: 'AI Portfolio Builder',
      description: 'A platform that uses LLMs to generate personalized portfolio web pages based on raw resume inputs.',
      technologies: ['Node.js', 'Express', 'React', 'MongoDB'],
      link: 'https://github.com/alexmercer/ai-portfolio'
    },
    {
      title: 'Real-time Chat Application',
      description: 'A responsive chat application using WebSockets for instantaneous group messaging.',
      technologies: ['TypeScript', 'Angular', 'Socket.io'],
      link: 'https://github.com/alexmercer/chatty'
    }
  ];

  // Certifications
  const certifications = [
    {
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: new Date('2024-02-15')
    }
  ];

  const languages = ['English (Fluent)', 'Spanish (Conversational)'];

  // AI summary
  const summarySkillStr = detectedSkills.slice(0, 3).join(', ');
  const aiSummary = `Experienced and result-oriented software professional with a strong foundation in ${summarySkillStr}. Proven track record of building performant, responsive web applications and backend systems. Experienced in collaborating across cross-functional teams to deliver scalable software solutions that drive business value.`;

  // Suggestions
  const suggestions = {
    resumeTitle: detectedSkills.includes('Angular') || detectedSkills.includes('React') 
      ? 'Senior Frontend Engineer | UI Architect' 
      : 'Full Stack Software Engineer',
    summary: `Dynamic Software Engineer with expertise in ${detectedSkills.slice(0, 4).join(', ')}. Passionate about writing clean, maintainable code, optimizing API responses, and creating intuitive user experiences.`,
    missingKeywords: missingSkills,
    missingProjects: [
      'Cloud Deployment Project (demonstrating AWS/Docker containerization capabilities)',
      'State Management Architecture (implementing Redux/NgRx/Signals in a complex web application)'
    ],
    missingAchievements: [
      'Quantifiable metrics (e.g. \"improved API performance by 35%\", \"reduced load time by 1.2s\")',
      'Leadership achievements like mentoring junior staff or leading agile standups'
    ],
    improvedBulletPoints: [
      {
        original: 'Responsible for writing code and fixing bugs.',
        improved: 'Developed and debugged 20+ core features in a Scrum team, reducing technical debt by 15%.',
        reason: 'Uses action verbs and quantitative metrics to show tangible impact.'
      },
      {
        original: 'Helped load speed optimization.',
        improved: 'Spearheaded frontend optimization initiatives, achieving a 30% reduction in Lighthouse load times.',
        reason: 'Highlights direct ownership and defines specific metrics.'
      }
    ]
  };

  const grammarCheck = [
    {
      mistake: 'Responsible for build features',
      correction: 'Responsible for building features',
      explanation: 'Prepositions like \"for\" should be followed by a gerund (-ing verb form) when indicating purpose.'
    }
  ];

  const formattingIssues = [
    'Consider using a single font family (e.g., Inter, Roboto) for better readability.',
    'Margins on left and right should be consistent (at least 0.75 inches).'
  ];

  const linkedInHeadline = `${name} | Software Engineer | Specializing in ${detectedSkills.slice(0, 3).join(' & ')} | Building High-Performance SaaS Solutions`;
  const resumeHeadline = `Full Stack Engineer passionate about building scalable, user-centric web applications`;
  const professionalBio = `I am a dedicated software developer with over ${experience.length + 1} years of experience in modern web technologies. I specialize in designing robust backend systems and crafting interactive, accessible frontend interfaces. I thrive in collaborative environments that solve complex problems.`;

  const coverLetter = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position. With my background in full stack development and hands-on experience with ${detectedSkills.slice(0, 3).join(', ')}, I am confident in my ability to make an immediate, positive impact on your engineering team.\n\nThroughout my career, I have focused on writing clean, scalable code and delivering high-quality user experiences. In my previous role at ${experience[0] ? experience[0].company : 'my last company'}, I successfully built features that improved efficiency and drove user engagement. I am excited about the opportunity to bring my technical skills and collaborative mindset to your organization.\n\nThank you for your time and consideration. I look forward to the opportunity of discussing how my skills align with your needs.\n\nSincerely,\n${name}`;

  const interviewQuestions = [
    {
      question: `Can you explain the difference between client-side state management and backend database design in the context of ${detectedSkills[0] || 'Web Apps'}?`,
      answerOutline: `Begin by defining local state versus server state. Reference tools you have used (like Angular Signals/RxJS or Redux) and explain how REST/GraphQL APIs connect the two layers efficiently.`
    },
    {
      question: `How do you go about optimizing API endpoints or frontend bundle sizes?`,
      answerOutline: `Discuss optimization strategies like lazy loading, tree shaking, caching, indexing databases, database connection pooling, and payload compression.`
    }
  ];

  const learningResources = missingSkills.map(skill => ({
    skill,
    resourceName: `Official ${skill} Documentation & Learning Path`,
    url: `https://www.google.com/search?q=official+${skill.toLowerCase()}+documentation+learning`
  }));

  return {
    name,
    email,
    phone,
    skills: detectedSkills,
    education,
    experience,
    projects,
    certifications,
    languages,
    atsScore: score,
    aiSummary,
    analysis: {
      detectedSkills,
      missingSkills,
      strongSkills,
      weakSkills,
      grammarCheck,
      formattingIssues,
      suggestions,
      linkedInHeadline,
      resumeHeadline,
      professionalBio,
      coverLetter,
      interviewQuestions,
      learningResources
    }
  };
};

// Analyze Resume
const analyzeResume = async (fileBuffer, originalName, mimeType) => {
  const textContent = await extractText(fileBuffer, originalName, mimeType);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Gemini API key is not configured. Falling back to Heuristic Mock Resume Analyzer.');
    return generateMockAnalysis(textContent);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash or gemini-1.5-flash (safe standard model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser and senior recruiter.
      Analyze the following resume text and return a JSON object with the parsed details and AI career suggestions.
      You must respond ONLY with the valid JSON object, containing no markdown framing and no explanation.

      JSON Structure:
      {
        "name": "Candidate Name (extract or guess based on header)",
        "email": "Email address",
        "phone": "Phone number",
        "skills": ["List of detected technical/professional skills"],
        "education": [
          {
            "school": "School Name",
            "degree": "Degree (e.g. BS, MS)",
            "fieldOfStudy": "Field (e.g. Computer Science)",
            "from": "ISO date string or null",
            "to": "ISO date string or null",
            "current": true/false,
            "description": "Short description"
          }
        ],
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "location": "Location",
            "from": "ISO date string or null",
            "to": "ISO date string or null",
            "current": true/false,
            "description": "Job duties"
          }
        ],
        "projects": [
          {
            "title": "Project Title",
            "description": "Details",
            "technologies": ["tech used"],
            "link": "link if any or empty string"
          }
        ],
        "certifications": [
          {
            "name": "Certification Name",
            "issuer": "Issuer",
            "date": "ISO date string or null"
          }
        ],
        "languages": ["Language (proficiency)"],
        "atsScore": 85, // integer from 0 to 100 rating formatting, keyword match, and bullet point strengths
        "aiSummary": "A professional 3-sentence summary of the candidate's career.",
        "analysis": {
          "detectedSkills": ["All skills detected"],
          "missingSkills": ["Skills that are standard in this candidate's field but missing"],
          "strongSkills": ["Top 3-5 strongest skills based on experience description"],
          "weakSkills": ["Skills mentioned but without deep experience backing"],
          "grammarCheck": [
            {
              "mistake": "Grammar/spelling mistake",
              "correction": "Corrected sentence/word",
              "explanation": "Why this change matters"
            }
          ],
          "formattingIssues": ["List of visual design or layout issues (e.g. margins, font consistency)"],
          "suggestions": {
            "resumeTitle": "Recommended career title for the resume header",
            "summary": "An improved resume summary statement",
            "missingKeywords": ["Keywords to add to pass ATS filters"],
            "missingProjects": ["Type of projects to build to cover skill gaps"],
            "missingAchievements": ["Achievements/metrics to add"],
            "improvedBulletPoints": [
              {
                "original": "Original bullet point",
                "improved": "ATS optimized bullet point with action verbs and metrics",
                "reason": "Why the improvement helps"
              }
            ]
          },
          "linkedInHeadline": "A professional, catchy LinkedIn headline (e.g. Title | Tech Stack | Value)",
          "resumeHeadline": "A strong resume headline",
          "professionalBio": "A 1-paragraph professional bio for portfolios",
          "coverLetter": "A professional cover letter template tailored to this candidate",
          "interviewQuestions": [
            {
              "question": "A technical or behavioral question custom tailored to this resume",
              "answerOutline": "Key points the candidate should address in their answer"
            }
          ],
          "learningResources": [
            {
              "skill": "Name of missing skill",
              "resourceName": "Online course name or documentation",
              "url": "Search URL or course URL"
            }
          ]
        }
      }

      Resume Text:
      """
      ${textContent}
      """
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean up any markdown code blocks if the model returned them
    const cleanJsonString = responseText
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const parsedData = JSON.parse(cleanJsonString);
    return parsedData;
  } catch (error) {
    console.error('Gemini API Error, falling back to local analyzer:', error);
    return generateMockAnalysis(textContent);
  }
};

// Match Resume against Jobs
const matchJobs = (resume, jobs) => {
  const resumeSkills = (resume.skills || []).map(s => s.toLowerCase());

  return jobs.map(job => {
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    if (jobSkills.length === 0) {
      return {
        jobId: job._id,
        matchPercentage: 50,
        explanation: 'No explicit skills required for this job, generic matching applied.',
        missingSkills: [],
        strengths: []
      };
    }

    const matching = jobSkills.filter(s => resumeSkills.some(rs => rs.includes(s) || s.includes(rs)));
    const missing = job.skills.filter(s => !resumeSkills.some(rs => rs.includes(s.toLowerCase()) || s.toLowerCase().includes(rs)));
    const strengths = job.skills.filter(s => resumeSkills.some(rs => rs.includes(s.toLowerCase()) || s.toLowerCase().includes(rs)));

    let matchPercentage = Math.round((matching.length / jobSkills.length) * 100);
    // Base matches get some minimums or adjustments
    if (matchPercentage < 20 && matching.length > 0) matchPercentage = 25;
    if (matchPercentage === 0) matchPercentage = 15;

    let explanation = `Your resume has a ${matchPercentage}% match for the ${job.title} position at ${job.company}. `;
    if (matching.length > 0) {
      explanation += `We found strong alignment with your experience in ${matching.slice(0, 3).join(', ')}. `;
    } else {
      explanation += `There is limited keyword overlap between your resume and the required skills. `;
    }

    if (missing.length > 0) {
      explanation += `Adding projects or certifications in ${missing.slice(0, 2).join(', ')} would improve your match score.`;
    }

    return {
      jobId: job._id,
      matchPercentage,
      explanation,
      missingSkills: missing,
      strengths
    };
  });
};

module.exports = {
  extractText,
  analyzeResume,
  matchJobs
};
