import { UserProfile, JobPosting, CompatibilityResult } from '../types';

export function calculateCompatibility(profile: UserProfile, job: JobPosting): CompatibilityResult {
  // Simple heuristic based scoring as source of truth
  let skillsScore = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  job.requiredSkills.forEach(skill => {
    const matched = profile.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()));
    if (matched) {
      skillsScore += 1;
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const skillMatchPercentage = job.requiredSkills.length > 0 ? (skillsScore / job.requiredSkills.length) * 100 : 100;
  
  // Experience Match
  let experienceScore = 100;
  if (profile.yearsOfExperience < job.minYearsExperience) {
    experienceScore = Math.max(0, 100 - ((job.minYearsExperience - profile.yearsOfExperience) * 20)); 
  }

  // Final weighted score
  const finalScore = Math.round((skillMatchPercentage * 0.7) + (experienceScore * 0.3));

  return {
    compatibilityScore: finalScore,
    opportunityScore: finalScore,
    isEligible: finalScore > 60,
    eligibilityReason: finalScore > 60 ? 'Matches core requirements' : 'Missing key requirements',
    matchedSkills,
    partialSkills: [],
    missingSkills,
    strengths: ['Relevant domain experience'],
    concerns: missingSkills.length > 0 ? ['Missing some technical skills'] : [],
    breakdown: {
      skillsScore: skillMatchPercentage,
      experienceScore: experienceScore,
      roleScore: 100,
      locationScore: 100,
      qualificationScore: 100
    }
  };
}
