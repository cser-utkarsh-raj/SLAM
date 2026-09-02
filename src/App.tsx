import React, { useEffect, useState, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { JobDiscoveryView } from './components/JobDiscoveryView';
import { TrackerView } from './components/TrackerView';
import { ProfileView } from './components/ProfileView';
import { SavedJobsView } from './components/SavedJobsView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DotFooter } from './components/DotFooter';
import { AuthModal } from './components/AuthModal';
import { SlamPlusModal } from './components/SlamPlusModal';
import { 
  AuthService, 
  AuthUser, 
  fetchFirestoreProfile, 
  saveFirestoreProfile, 
  fetchFirestoreApplications, 
  saveFirestoreApplications, 
  fetchFirestoreSavedJobIds, 
  saveFirestoreSavedJobIds 
} from './services/firebaseAuth';
import { 
  UserProfile, 
  JobPosting, 
  ApplicationAnswer, 
  ApplicationRecord, 
  TailoredResume, 
  ApplicationStatus 
} from './types';

const emptyProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  country: '',
  timezone: '',
  headline: '',
  summary: '',
  yearsOfExperience: 0,
  currentRole: '',
  targetRoles: ['Software Engineer'],
  industries: [],
  skills: [],
  technologies: [],
  certifications: [],
  education: [],
  workHistory: [],
  languages: [],
  workAuth: 'Unknown',
  sponsorshipRequired: false,
  noticePeriod: '',
  availability: '',
  relocationPreference: 'No',
  salaryExpectation: '',
};

const API = import.meta.env.VITE_API_URL || '';

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => AuthService.init());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSlamPlusModalOpen, setIsSlamPlusModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => safeParse('slam_plus_active', false));

  // User Data State
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    safeParse('slam_user_profile', emptyProfile)
  );
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() =>
    safeParse('slam_saved_job_ids', [])
  );
  const [compareJobIds, setCompareJobIds] = useState<string[]>([]);
  const [answerLibrary, setAnswerLibrary] = useState<ApplicationAnswer[]>(() =>
    safeParse('slam_answer_library', [])
  );
  const [applicationRecords, setApplicationRecords] = useState<ApplicationRecord[]>(() =>
    safeParse('slam_app_records', [])
  );

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('Software Engineer');
  const [countryQuery, setCountryQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        // Fetch persisted Firestore data
        const [cloudProfile, cloudApps, cloudSaved] = await Promise.all([
          fetchFirestoreProfile(user.uid, user.idToken),
          fetchFirestoreApplications(user.uid, user.idToken),
          fetchFirestoreSavedJobIds(user.uid, user.idToken),
        ]);

        if (cloudProfile && (cloudProfile.name || cloudProfile.skills?.length)) {
          setUserProfile(cloudProfile);
          localStorage.setItem('slam_user_profile', JSON.stringify(cloudProfile));
        }
        if (cloudApps && cloudApps.length > 0) {
          setApplicationRecords(cloudApps);
          localStorage.setItem('slam_app_records', JSON.stringify(cloudApps));
        }
        if (cloudSaved && cloudSaved.length > 0) {
          setSavedJobIds(cloudSaved);
          localStorage.setItem('slam_saved_job_ids', JSON.stringify(cloudSaved));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize country query from profile when profile changes
  useEffect(() => {
    if (userProfile.country && !countryQuery) {
      setCountryQuery(userProfile.country);
    }
  }, [userProfile.country]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('slam_user_profile', JSON.stringify(userProfile));
    if (authUser && (userProfile.name || userProfile.email || userProfile.skills.length)) {
      void saveFirestoreProfile(authUser.uid, authUser.idToken, userProfile);
    }
  }, [userProfile, authUser]);

  useEffect(() => {
    localStorage.setItem('slam_saved_job_ids', JSON.stringify(savedJobIds));
    if (authUser) {
      void saveFirestoreSavedJobIds(authUser.uid, authUser.idToken, savedJobIds);
    }
  }, [savedJobIds, authUser]);

  useEffect(() => {
    localStorage.setItem('slam_app_records', JSON.stringify(applicationRecords));
    if (authUser) {
      void saveFirestoreApplications(authUser.uid, authUser.idToken, applicationRecords);
    }
  }, [applicationRecords, authUser]);

  useEffect(() => {
    localStorage.setItem('slam_plus_active', JSON.stringify(isSubscribed));
  }, [isSubscribed]);

  // Live Job Search function
  const performJobSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const q = searchQuery.trim() || userProfile.targetRoles.find(Boolean) || 'software engineer';
      const c = countryQuery.trim() || userProfile.country.trim();
      const res = await fetch(`${API}/api/jobs/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          location: userProfile.location || '',
          country: c,
          remote: remoteOnly,
          limit: 30,
          profile: userProfile,
        }),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Invalid JSON from server');
      }

      if (data?.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.warn('Job search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, countryQuery, remoteOnly, userProfile]);

  // Auto-search on initial load or profile role change
  useEffect(() => {
    void performJobSearch();
  }, [userProfile.country, userProfile.targetRoles.join('|')]);

  const toggleSave = (id: string) => {
    setSavedJobIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCompare = (job: JobPosting) => {
    setCompareJobIds((prev) =>
      prev.includes(job.id)
        ? prev.filter((x) => x !== job.id)
        : prev.length < 4
        ? [...prev, job.id]
        : prev
    );
  };

  const handleSaveToTracker = (
    job: JobPosting,
    resume: TailoredResume | null,
    letter: string,
    answers: { question: string; answer: string }[]
  ) => {
    const match = (job as any).match;
    const record: ApplicationRecord = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salaryText: job.salaryText,
      dateDiscovered: job.postingDate || new Date().toISOString().split('T')[0],
      dateApplied: undefined,
      status: 'PREPARED',
      compatibilityScore: match?.compatibilityScore ?? 85,
      applicationMode: 'REVIEW',
      tailoredResume: resume || undefined,
      coverLetter: letter || undefined,
      submittedAnswers: answers,
      notes: 'Prepared with zero-fabrication profile alignment. Review materials before final submission.',
      applicationUrl: job.applicationUrl,
      source: job.primarySource || 'SLAM Discovery',
      lastUpdated: new Date().toISOString(),
    };

    setApplicationRecords((prev) => [record, ...prev.filter((x) => x.jobId !== job.id)]);
    setActiveTab('applications');
  };

  const handleSignOut = () => {
    AuthService.signOut();
    setAuthUser(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        authUser={authUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSlamPlus={() => setIsSlamPlusModalOpen(true)}
        isSubscribed={isSubscribed}
      />

      <main className="flex-1 w-full pb-16">
        {activeTab === 'discover' && (
          <JobDiscoveryView
            jobs={jobs}
            userProfile={userProfile}
            savedJobIds={savedJobIds}
            onToggleSaveJob={toggleSave}
            compareJobIds={compareJobIds}
            onToggleCompareJob={toggleCompare}
            onPrepareJob={(job) => {}}
            answerLibrary={answerLibrary}
            onUpdateAnswerLibrary={setAnswerLibrary}
            onLaunchAutomation={() => {}}
            onSaveToTracker={handleSaveToTracker}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            countryQuery={countryQuery}
            setCountryQuery={setCountryQuery}
            remoteOnly={remoteOnly}
            setRemoteOnly={setRemoteOnly}
            onSearch={performJobSearch}
            isSearching={isSearching}
          />
        )}

        {activeTab === 'saved' && (
          <SavedJobsView
            jobs={jobs}
            savedJobIds={savedJobIds}
            userProfile={userProfile}
            onToggleSaveJob={toggleSave}
            onNavigateToDiscover={() => setActiveTab('discover')}
            onSaveToTracker={handleSaveToTracker}
          />
        )}

        {activeTab === 'applications' && (
          <TrackerView
            applications={applicationRecords}
            onUpdateStatus={(id: string, status: ApplicationStatus) =>
              setApplicationRecords((prev) =>
                prev.map((r) =>
                  r.id === id
                    ? {
                        ...r,
                        status,
                        dateApplied:
                          status === 'APPLIED' && !r.dateApplied
                            ? new Date().toISOString().split('T')[0]
                            : r.dateApplied,
                        lastUpdated: new Date().toISOString(),
                      }
                    : r
                )
              )
            }
            onUpdateNotes={(id: string, notes: string) =>
              setApplicationRecords((prev) =>
                prev.map((r) =>
                  r.id === id
                    ? { ...r, notes, lastUpdated: new Date().toISOString() }
                    : r
                )
              )
            }
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
          />
        )}

        {activeTab === 'onboarding' && (
          <OnboardingFlow
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onComplete={() => setActiveTab('discover')}
          />
        )}
      </main>

      <DotFooter />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* SLAM+ Subscription Modal */}
      <SlamPlusModal
        isOpen={isSlamPlusModalOpen}
        onClose={() => setIsSlamPlusModalOpen(false)}
        isSubscribed={isSubscribed}
        onToggleSubscription={() => setIsSubscribed((p) => !p)}
      />
    </div>
  );
}
