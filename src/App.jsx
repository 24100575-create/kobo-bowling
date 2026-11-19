import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Users,
  Calculator,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  Unlock,
  Eye,
  ShieldCheck,
  ChevronRight,
  Calendar,
  FolderPlus,
  Archive,
  RotateCcw,
  History,
  Layers,
  UserPlus,
  LayoutGrid,
  Copy,
  Image as ImageIcon,
  Shuffle,
  Share2,
  PauseCircle,
  PlayCircle,
  Edit3,
  Download,
  UserX,
  Settings,
  LogOut,
  KeyRound,
  Cloud,
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// 클라우드 실시간 동기화 안전 초기화 (미리보기 환경 + 외부 구글 사이트 내보내기 환경 모두 지원)
const EXTERNAL_FB_STORAGE_KEY = 'kobo_bowling_external_firebase_config_v1';
const LOCAL_CLUB_STORAGE_KEY = 'kobo_bowling_local_club_data_v1';

function resolveFirebaseConfig() {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
    }
  } catch {
    // ignore preview global parse error
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(EXTERNAL_FB_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch {
    // ignore localStorage error
  }
  return {
  apiKey: "AIzaSyCsnZeDwQJ3AO14hQ2Lb1PegPcpOHZ1iMk",
  authDomain: "kobo-parkminwoo.firebaseapp.com",
  projectId: "kobo-parkminwoo",
  storageBucket: "kobo-parkminwoo.firebasestorage.app",
  messagingSenderId: "574875572101",
  appId: "1:574875572101:web:71dbe7f149a550a1a496ec",
  measurementId: "G-RW217TEQPL"
}

const activeFirebaseConfig = resolveFirebaseConfig();
let firebaseApp = null;
let auth = null;
let db = null;

if (activeFirebaseConfig && activeFirebaseConfig.apiKey) {
  try {
    firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(activeFirebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  } catch {
    firebaseApp = null;
    auth = null;
    db = null;
  }
}

const appId =
  typeof __app_id !== 'undefined' && __app_id ? __app_id : 'kobo-bowling-club-web';

// ==========================================
// 초기 데이터 정의 (KOBO 볼링 클럽 다회차 + 학기 아카이브 샘플)
// ==========================================
const INITIAL_MEMBERS = [
  { id: 'm1', name: '김민수', baseAvg: 188, handicap: 8, isGuest: false, status: 'active' },
  { id: 'm2', name: '이지은', baseAvg: 152, handicap: 32, isGuest: false, status: 'active' },
  { id: 'm3', name: '박현우', baseAvg: 196, handicap: 2, isGuest: false, status: 'active' },
  { id: 'm4', name: '최서연', baseAvg: 141, handicap: 40, isGuest: false, status: 'active' },
  { id: 'm5', name: '정태양', baseAvg: 175, handicap: 17, isGuest: false, status: 'active' },
  { id: 'm6', name: '강하늘', baseAvg: 164, handicap: 24, isGuest: false, status: 'active' },
  { id: 'm7', name: '윤도현', baseAvg: 182, handicap: 12, isGuest: false, status: 'active' },
  { id: 'm8', name: '송지효', baseAvg: 135, handicap: 45, isGuest: false, status: 'active' },
  { id: 'm9', name: '한지민(게스트)', baseAvg: 148, handicap: 35, isGuest: true, status: 'active' },
  { id: 'm10', name: '오세훈', baseAvg: 169, handicap: 21, isGuest: false, status: 'active' },
  { id: 'm11', name: '임수진', baseAvg: 158, handicap: 28, isGuest: false, status: 'active' },
  { id: 'm12', name: '조정석', baseAvg: 191, handicap: 6, isGuest: false, status: 'active' },
  { id: 'm13', name: '서강준(휴면)', baseAvg: 172, handicap: 19, isGuest: false, status: 'dormant' },
];

const TOTAL_LANES = 16;
const SLOTS_PER_LANE = 4;
const DEFAULT_ADMIN_PIN = '1234';

// 레인 번호(1~16)에 4칸 슬롯 배열 초기화
const createEmptyLanes = () => {
  const lanes = {};
  for (let i = 1; i <= TOTAL_LANES; i += 1) {
    lanes[i] = [null, null, null, null];
  }
  return lanes;
};

const INITIAL_SESSIONS = [
  {
    id: 's-2026-40',
    date: '2026-10-18',
    title: '제40회 정기전',
    gameFee: 4500,
    sidePotFee: 2000,
    extraFund: 15000,
    lanes: {
      ...createEmptyLanes(),
      1: ['m3', 'm1', 'm5', 'm2'],
      2: ['m7', 'm6', 'm4', 'm8'],
    },
    records: [
      { memberId: 'm1', scores: [189, 195, 182], shoeRental: false },
      { memberId: 'm2', scores: [148, 156, 150], shoeRental: false },
      { memberId: 'm3', scores: [212, 198, 205], shoeRental: false },
      { memberId: 'm4', scores: [135, 144, 140], shoeRental: true },
      { memberId: 'm5', scores: [176, 181, 169], shoeRental: false },
      { memberId: 'm6', scores: [162, 168], shoeRental: false },
      { memberId: 'm7', scores: [184, 179, 188], shoeRental: false },
      { memberId: 'm8', scores: [129, 138, 134], shoeRental: true },
    ],
  },
  {
    id: 's-2026-41',
    date: '2026-11-01',
    title: '제41회 정기전',
    gameFee: 4500,
    sidePotFee: 2000,
    extraFund: 20000,
    lanes: {
      ...createEmptyLanes(),
      1: ['m3', 'm7', 'm6', 'm4'],
      2: ['m1', 'm5', 'm10', 'm2'],
      3: ['m11', 'm8', null, null],
    },
    records: [
      { memberId: 'm1', scores: [192, 184, 199], shoeRental: false },
      { memberId: 'm2', scores: [155, 161, 149], shoeRental: false },
      { memberId: 'm3', scores: [204, 215, 196], shoeRental: false },
      { memberId: 'm4', scores: [142, 139, 151], shoeRental: true },
      { memberId: 'm5', scores: [179, 172, 185, 168], shoeRental: false },
      { memberId: 'm6', scores: [166, 171, 159], shoeRental: false },
      { memberId: 'm7', scores: [190, 182], shoeRental: false },
      { memberId: 'm8', scores: [141, 136, 144], shoeRental: true },
      { memberId: 'm10', scores: [172, 165, 178], shoeRental: false },
      { memberId: 'm11', scores: [154, 163, 159], shoeRental: false },
    ],
  },
  {
    id: 's-2026-42',
    date: '2026-11-15',
    title: '제42회 정기전',
    gameFee: 4500,
    sidePotFee: 2000,
    extraFund: 20000,
    lanes: {
      ...createEmptyLanes(),
      1: ['m3', 'm5', 'm6', 'm8'],
      2: ['m12', 'm7', 'm11', 'm2'],
      3: ['m1', 'm10', 'm9', 'm4'],
    },
    records: [
      { memberId: 'm1', scores: [194, 208, 187], shoeRental: false },
      { memberId: 'm2', scores: [158, 164, 152], shoeRental: false },
      { memberId: 'm3', scores: [215, 198, 209, 201], shoeRental: false },
      { memberId: 'm4', scores: [146, 153], shoeRental: true },
      { memberId: 'm5', scores: [181, 174, 189], shoeRental: false },
      { memberId: 'm6', scores: [168, 172, 165], shoeRental: false },
      { memberId: 'm7', scores: [186, 191, 178], shoeRental: false },
      { memberId: 'm8', scores: [139, 144, 137], shoeRental: true },
      { memberId: 'm9', scores: [151, 147], shoeRental: true },
      { memberId: 'm10', scores: [174, 169, 181], shoeRental: false },
      { memberId: 'm11', scores: [161, 157, 166], shoeRental: false },
      { memberId: 'm12', scores: [195, 203, 188], shoeRental: false },
    ],
  },
];

// 이전 학기 보관(아카이브) 예시 데이터
const INITIAL_ARCHIVED_SEMESTERS = [
  {
    id: 'sem-2026-1',
    name: '2026-1학기',
    archivedAt: '2026-06-28',
    membersSnapshot: INITIAL_MEMBERS.map((m) => ({
      ...m,
      baseAvg: Math.max(120, m.baseAvg - 4),
    })),
    sessions: [
      {
        id: 's-2026-1-38',
        date: '2026-05-17',
        title: '2026-1학기 5월 정기전',
        gameFee: 4500,
        sidePotFee: 2000,
        extraFund: 15000,
        lanes: {
          ...createEmptyLanes(),
          1: ['m3', 'm1', 'm5', 'm2'],
          2: ['m12', 'm7', 'm6', 'm4'],
        },
        records: [
          { memberId: 'm1', scores: [182, 190, 178], shoeRental: false },
          { memberId: 'm2', scores: [145, 151, 149], shoeRental: false },
          { memberId: 'm3', scores: [201, 194, 208], shoeRental: false },
          { memberId: 'm4', scores: [134, 140, 138], shoeRental: true },
          { memberId: 'm5', scores: [171, 177, 169], shoeRental: false },
          { memberId: 'm6', scores: [158, 164, 160], shoeRental: false },
          { memberId: 'm7', scores: [180, 175, 184], shoeRental: false },
          { memberId: 'm12', scores: [189, 195, 186], shoeRental: false },
        ],
      },
      {
        id: 's-2026-1-39',
        date: '2026-06-21',
        title: '2026-1학기 결산 정기전',
        gameFee: 4500,
        sidePotFee: 2000,
        extraFund: 25000,
        lanes: {
          ...createEmptyLanes(),
          1: ['m3', 'm12', 'm1', 'm7'],
          2: ['m5', 'm6', 'm2', 'm4'],
        },
        records: [
          { memberId: 'm1', scores: [191, 186, 195], shoeRental: false },
          { memberId: 'm2', scores: [152, 158, 154], shoeRental: false },
          { memberId: 'm3', scores: [210, 202, 214], shoeRental: false },
          { memberId: 'm4', scores: [141, 146, 143], shoeRental: true },
          { memberId: 'm5', scores: [176, 182, 174], shoeRental: false },
          { memberId: 'm6', scores: [165, 169, 162], shoeRental: false },
          { memberId: 'm7', scores: [185, 189, 181], shoeRental: false },
          { memberId: 'm12', scores: [194, 199, 191], shoeRental: false },
        ],
      },
    ],
  },
];

// 안전한 클립보드 복사 유틸리티
async function copyTextSafely(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  // 클라우드 인증 및 실시간 동기화 상태
  const [fbUser, setFbUser] = useState(null);
  const [isCloudReady, setIsCloudReady] = useState(!auth || !db);
  const [isSyncing, setIsSyncing] = useState(false);
  const [externalConfigInput, setExternalConfigInput] = useState(() => {
    try {
      return localStorage.getItem(EXTERNAL_FB_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // 권한 및 인증 상태 (null: 선택 전, 'member': 회원 읽기전용, 'admin': 운영진)
  const [role, setRole] = useState(null);
  const [adminPin, setAdminPin] = useState(DEFAULT_ADMIN_PIN);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // 임원진 설정(비밀번호 변경 & 로그아웃) 모달 상태
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // 내비게이션 탭 ('leaderboard' | 'scores' | 'lanes' | 'teams' | 'settlement' | 'members')
  const [activeTab, setActiveTab] = useState('leaderboard');

  // 기록표 하위 탭 ('table' | 'cards')
  const [rankingViewMode, setRankingViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('avg'); // 'avg' | 'total' | 'high' | 'games'

  // 학기 관리 상태 (현재 진행 학기 + 보관된 이전 학기 목록)
  const [currentSemesterName, setCurrentSemesterName] = useState('2026-2학기');
  const [archivedSemesters, setArchivedSemesters] = useState(INITIAL_ARCHIVED_SEMESTERS);
  const [selectedSemesterId, setSelectedSemesterId] = useState('current'); // 'current' 또는 archived.id
  const [showResetSemesterModal, setShowResetSemesterModal] = useState(false);
  const [nextSemesterName, setNextSemesterName] = useState('2027-1학기');
  const [nextFirstDate, setNextFirstDate] = useState('2027-03-07');
  const [nextFirstTitle, setNextFirstTitle] = useState('2027-1학기 제1회 정기전');
  const [updateBaseAvgFromSemester, setUpdateBaseAvgFromSemester] = useState(true);

  // 클럽 전체 회원 및 현재 학기 정기전 회차 목록 (실시간 클라우드 동기화)
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState(
    INITIAL_SESSIONS[INITIAL_SESSIONS.length - 1].id
  );

  // 회원 관리 필터 ('all' | 'active' | 'dormant')
  const [memberFilter, setMemberFilter] = useState('all');

  // 새 회차(과거 또는 신규 정기전) 추가 모달 상태
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState('2026-11-29');
  const [newSessionTitle, setNewSessionTitle] = useState('제43회 정기전');
  const [newSessionGameFee, setNewSessionGameFee] = useState(4500);
  const [newSessionSidePot, setNewSessionSidePot] = useState(2000);

  // 신규 회원 추가 상태
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvg, setNewMemberAvg] = useState(150);
  const [newMemberHandicap, setNewMemberHandicap] = useState(30);
  const [newMemberIsGuest, setNewMemberIsGuest] = useState(false);

  // 회원 삭제 확인 모달 상태
  const [deleteTargetMember, setDeleteTargetMember] = useState(null);

  // 회차(전 기록) 삭제 확인 모달 상태
  const [deleteTargetSession, setDeleteTargetSession] = useState(null);

  // 보관된 이전 학기 삭제 확인 모달 상태
  const [deleteTargetSemester, setDeleteTargetSemester] = useState(null);

  // 팀 짜기 상태
  const [teamCount, setTeamCount] = useState(3);
  const [teams, setTeams] = useState([]);

  // 레인표 배정 상태
  const [laneFilter, setLaneFilter] = useState('assigned'); // 'assigned' | 'all'
  const [startLaneNum, setStartLaneNum] = useState(1);
  const [laneAssignMode, setLaneAssignMode] = useState('balanced'); // 'balanced' | 'random' | 'teams'
  const [assignModalTarget, setAssignModalTarget] = useState(null); // { laneNum, slotIdx }
  const [lanePreviewImage, setLanePreviewImage] = useState(null);

  // 정산 옵션 상태
  const [shoeRentalFee, setShoeRentalFee] = useState(1500);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [manualTextModal, setManualTextModal] = useState(null);

  // 로컬 저장소 불러오기 헬퍼 (외부 사이트 내보내기 환경 지원)
  const loadFromLocalFallback = () => {
    try {
      const raw = localStorage.getItem(LOCAL_CLUB_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (typeof data.adminPin === 'string' && /^\d{4,8}$/.test(data.adminPin)) {
        setAdminPin(data.adminPin);
      }
      if (typeof data.currentSemesterName === 'string') {
        setCurrentSemesterName(data.currentSemesterName);
      }
      if (Array.isArray(data.archivedSemesters)) {
        setArchivedSemesters(data.archivedSemesters);
      }
      if (Array.isArray(data.members)) {
        setMembers(data.members);
      }
      if (Array.isArray(data.sessions) && data.sessions.length > 0) {
        setSessions(data.sessions);
        setActiveSessionId((prevId) =>
          data.sessions.some((s) => s.id === prevId)
            ? prevId
            : data.sessions[data.sessions.length - 1].id
        );
      }
      if (typeof data.shoeRentalFee === 'number') {
        setShoeRentalFee(data.shoeRentalFee);
      }
      return true;
    } catch {
      return false;
    }
  };

  // 1) 클라우드 인증 초기화 (Firebase 설정이 없는 외부 환경이면 로컬 모드로 즉시 부팅)
  useEffect(() => {
    if (!auth || !db) {
      loadFromLocalFallback();
      setIsCloudReady(true);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch {
        loadFromLocalFallback();
        setIsCloudReady(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2) 공용 클럽 데이터 실시간 구독 (모든 기기 간 공유)
  useEffect(() => {
    if (!fbUser || !db) return;
    const sharedDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'club_state', 'main');

    const unsubscribe = onSnapshot(
      sharedDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.adminPin === 'string' && /^\d{4,8}$/.test(data.adminPin)) {
            setAdminPin(data.adminPin);
          }
          if (typeof data.currentSemesterName === 'string') {
            setCurrentSemesterName(data.currentSemesterName);
          }
          if (Array.isArray(data.archivedSemesters)) {
            setArchivedSemesters(data.archivedSemesters);
          }
          if (Array.isArray(data.members)) {
            setMembers(data.members);
          }
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(data.sessions);
            setActiveSessionId((prevId) =>
              data.sessions.some((s) => s.id === prevId)
                ? prevId
                : data.sessions[data.sessions.length - 1].id
            );
          }
          if (typeof data.shoeRentalFee === 'number') {
            setShoeRentalFee(data.shoeRentalFee);
          }
        } else {
          // 최초 실행 시 기본 데이터 클라우드에 초기화
          setDoc(sharedDocRef, {
            adminPin: DEFAULT_ADMIN_PIN,
            currentSemesterName: '2026-2학기',
            archivedSemesters: INITIAL_ARCHIVED_SEMESTERS,
            members: INITIAL_MEMBERS,
            sessions: INITIAL_SESSIONS,
            shoeRentalFee: 1500,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
        setIsCloudReady(true);
      },
      () => {
        loadFromLocalFallback();
        setIsCloudReady(true);
      }
    );

    return () => unsubscribe();
  }, [fbUser]);

  // 공용 클럽 상태 저장 함수 (클라우드 연결 시 실시간 공유 + 로컬 자동 백업)
  const syncClubStateToCloud = async (overrides = {}) => {
    const payload = {
      adminPin: overrides.adminPin !== undefined ? overrides.adminPin : adminPin,
      currentSemesterName:
        overrides.currentSemesterName !== undefined
          ? overrides.currentSemesterName
          : currentSemesterName,
      archivedSemesters:
        overrides.archivedSemesters !== undefined
          ? overrides.archivedSemesters
          : archivedSemesters,
      members: overrides.members !== undefined ? overrides.members : members,
      sessions: overrides.sessions !== undefined ? overrides.sessions : sessions,
      shoeRentalFee:
        overrides.shoeRentalFee !== undefined ? overrides.shoeRentalFee : shoeRentalFee,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(LOCAL_CLUB_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }

    if (!fbUser || !db) return;
    setIsSyncing(true);
    try {
      const sharedDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'club_state', 'main');
      await setDoc(sharedDocRef, payload);
    } catch {
      showToast('동기화 중 일시적인 네트워크 지연이 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 외부 사이트용 Firebase 설정 저장 핸들러
  const handleSaveExternalFirebaseConfig = () => {
    const trimmed = externalConfigInput.trim();
    if (!trimmed) {
      localStorage.removeItem(EXTERNAL_FB_STORAGE_KEY);
      showToast('외부 클라우드 설정이 해제되었습니다. 새로고침 후 적용됩니다.');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        showToast('올바른 Firebase 설정 JSON(apiKey, projectId 포함)을 입력해주세요.');
        return;
      }
      localStorage.setItem(EXTERNAL_FB_STORAGE_KEY, JSON.stringify(parsed));
      showToast('클라우드 설정이 저장되었습니다. 페이지를 새로고침하면 실시간 공유가 시작됩니다.');
    } catch {
      showToast('JSON 형식이 올바르지 않습니다. 중괄호 { ... } 형태로 입력해주세요.');
    }
  };

  // 현재 조회 중인 학기가 '보관된 이전 학기'인지 여부
  const isArchivedSemester = selectedSemesterId !== 'current';
  const activeArchivedSemester = useMemo(
    () => archivedSemesters.find((s) => s.id === selectedSemesterId) || null,
    [archivedSemesters, selectedSemesterId]
  );

  // 실효 권한: 운영진 로그인 상태 + 현재 진행 중인 학기일 때만 편집 가능
  const isAdmin = role === 'admin' && !isArchivedSemester;

  // 현재 활성 학기의 회원 목록 및 회차 목록
  const effectiveMembers = useMemo(
    () => (isArchivedSemester && activeArchivedSemester ? activeArchivedSemester.membersSnapshot : members),
    [isArchivedSemester, activeArchivedSemester, members]
  );

  const effectiveSessions = useMemo(
    () => (isArchivedSemester && activeArchivedSemester ? activeArchivedSemester.sessions : sessions),
    [isArchivedSemester, activeArchivedSemester, sessions]
  );

  // 날짜순 정렬된 회차 목록
  const sortedSessions = useMemo(() => {
    return [...effectiveSessions].sort((a, b) => a.date.localeCompare(b.date));
  }, [effectiveSessions]);

  // 현재 선택된 회차 객체
  const currentSession = useMemo(() => {
    return (
      effectiveSessions.find((s) => s.id === activeSessionId) ||
      sortedSessions[sortedSessions.length - 1]
    );
  }, [effectiveSessions, activeSessionId, sortedSessions]);

  // 학기 전환 시 해당 학기의 마지막 회차 자동 선택
  useEffect(() => {
    if (sortedSessions.length > 0) {
      const exists = sortedSessions.some((s) => s.id === activeSessionId);
      if (!exists) {
        setActiveSessionId(sortedSessions[sortedSessions.length - 1].id);
      }
    }
  }, [selectedSemesterId, sortedSessions, activeSessionId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  // ==========================================
  // 1. 현재 회차 개인별 기록 및 통계 계산 (가변 게임 수 지원)
  // ==========================================
  const sessionStats = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.records
      .map((rec) => {
        const member = effectiveMembers.find((m) => m.id === rec.memberId);
        if (!member) return null;

        const gameCount = rec.scores.length;
        const rawTotal = rec.scores.reduce((acc, v) => acc + (Number(v) || 0), 0);
        const rawAvg = gameCount > 0 ? rawTotal / gameCount : 0;
        const totalHandicap = member.handicap * gameCount;
        const finalTotal = rawTotal + totalHandicap;
        const finalAvg = gameCount > 0 ? finalTotal / gameCount : 0;
        const highGame = gameCount > 0 ? Math.max(...rec.scores.map((v) => Number(v) || 0)) : 0;
        const avgDiff = Number((finalAvg - member.baseAvg).toFixed(1));

        return {
          ...member,
          ...rec,
          gameCount,
          rawTotal,
          rawAvg: Number(rawAvg.toFixed(1)),
          totalHandicap,
          finalTotal,
          finalAvg: Number(finalAvg.toFixed(1)),
          highGame,
          avgDiff,
        };
      })
      .filter(Boolean);
  }, [currentSession, effectiveMembers]);

  // 현재 회차 에버리지 기준 정렬 (정기전 에버 1~10위 리더보드용)
  const sessionAvgRanked = useMemo(() => {
    return [...sessionStats].sort((a, b) => {
      if (b.finalAvg !== a.finalAvg) return b.finalAvg - a.finalAvg;
      if (b.finalTotal !== a.finalTotal) return b.finalTotal - a.finalTotal;
      return b.highGame - a.highGame;
    });
  }, [sessionStats]);

  // 현재 회차 에버 1~10위 리더보드
  const sessionTop10 = useMemo(() => {
    return sessionAvgRanked.slice(0, 10);
  }, [sessionAvgRanked]);

  // ==========================================
  // 2. 전체 상세 기록 (해당 학기의 모든 회차 기록 통합)
  // ==========================================
  const allTimeStats = useMemo(() => {
    const map = new Map();

    sortedSessions.forEach((session) => {
      session.records.forEach((rec) => {
        const member = effectiveMembers.find((m) => m.id === rec.memberId);
        if (!member) return;

        if (!map.has(member.id)) {
          map.set(member.id, {
            ...member,
            sessionCount: 0,
            totalGames: 0,
            rawTotal: 0,
            totalHandicap: 0,
            finalTotal: 0,
            highGame: 0,
            sessionHistory: [],
          });
        }

        const entry = map.get(member.id);
        const gCount = rec.scores.length;
        const sRaw = rec.scores.reduce((acc, v) => acc + (Number(v) || 0), 0);
        const sHandi = member.handicap * gCount;
        const sFinal = sRaw + sHandi;
        const sHigh = gCount > 0 ? Math.max(...rec.scores.map((v) => Number(v) || 0)) : 0;

        entry.sessionCount += 1;
        entry.totalGames += gCount;
        entry.rawTotal += sRaw;
        entry.totalHandicap += sHandi;
        entry.finalTotal += sFinal;
        if (sHigh > entry.highGame) entry.highGame = sHigh;

        entry.sessionHistory.push({
          sessionId: session.id,
          date: session.date,
          title: session.title,
          scores: rec.scores,
          gameCount: gCount,
          finalAvg: gCount > 0 ? Number((sFinal / gCount).toFixed(1)) : 0,
        });
      });
    });

    const list = Array.from(map.values()).map((item) => {
      const rawAvg = item.totalGames > 0 ? Number((item.rawTotal / item.totalGames).toFixed(1)) : 0;
      const finalAvg =
        item.totalGames > 0 ? Number((item.finalTotal / item.totalGames).toFixed(1)) : 0;
      const avgDiff = Number((finalAvg - item.baseAvg).toFixed(1));
      return {
        ...item,
        rawAvg,
        finalAvg,
        avgDiff,
      };
    });

    return list.sort((a, b) => {
      if (sortBy === 'avg') return b.finalAvg - a.finalAvg || b.finalTotal - a.finalTotal;
      if (sortBy === 'total') return b.finalTotal - a.finalTotal || b.finalAvg - a.finalAvg;
      if (sortBy === 'high') return b.highGame - a.highGame || b.finalAvg - a.finalAvg;
      if (sortBy === 'games') return b.totalGames - a.totalGames || b.finalAvg - a.finalAvg;
      return b.finalAvg - a.finalAvg;
    });
  }, [sortedSessions, effectiveMembers, sortBy]);

  // 전체 상세 기록 하단 클럽 평균 요약
  const allTimeSummaryRow = useMemo(() => {
    if (allTimeStats.length === 0) return null;
    const totalMembers = allTimeStats.length;
    const sumGames = allTimeStats.reduce((a, b) => a + b.totalGames, 0);
    const sumRaw = allTimeStats.reduce((a, b) => a + b.rawTotal, 0);
    const sumHandi = allTimeStats.reduce((a, b) => a + b.totalHandicap, 0);
    const sumFinal = allTimeStats.reduce((a, b) => a + b.finalTotal, 0);
    const avgOfAvgs = Number(
      (allTimeStats.reduce((a, b) => a + b.finalAvg, 0) / totalMembers).toFixed(1)
    );
    const maxHigh = Math.max(...allTimeStats.map((s) => s.highGame));

    return {
      totalMembers,
      avgGames: Number((sumGames / totalMembers).toFixed(1)),
      totalGames: sumGames,
      avgRaw: Math.round(sumRaw / totalMembers),
      avgHandi: Math.round(sumHandi / totalMembers),
      avgFinal: Math.round(sumFinal / totalMembers),
      avgOfAvgs,
      maxHigh,
    };
  }, [allTimeStats]);

  // ==========================================
  // 3. 레인 배정표 데이터 계산 (1~16레인, 레인당 4명)
  // ==========================================
  const currentLanes = useMemo(() => {
    const base = createEmptyLanes();
    if (!currentSession?.lanes) return base;
    for (let i = 1; i <= TOTAL_LANES; i += 1) {
      if (Array.isArray(currentSession.lanes[i])) {
        base[i] = [
          currentSession.lanes[i][0] || null,
          currentSession.lanes[i][1] || null,
          currentSession.lanes[i][2] || null,
          currentSession.lanes[i][3] || null,
        ];
      }
    }
    return base;
  }, [currentSession]);

  const assignedMemberIds = useMemo(() => {
    const set = new Set();
    Object.values(currentLanes).forEach((slots) => {
      slots.forEach((id) => {
        if (id) set.add(id);
      });
    });
    return set;
  }, [currentLanes]);

  const unassignedActiveMembers = useMemo(() => {
    return effectiveMembers.filter((m) => m.status !== 'dormant' && !assignedMemberIds.has(m.id));
  }, [effectiveMembers, assignedMemberIds]);

  const laneSummaries = useMemo(() => {
    const list = [];
    for (let laneNum = 1; laneNum <= TOTAL_LANES; laneNum += 1) {
      const slots = currentLanes[laneNum];
      const slotMembers = slots.map((memberId) => {
        if (!memberId) return null;
        const member = effectiveMembers.find((m) => m.id === memberId);
        if (!member) return null;
        return {
          ...member,
          displayAvg: member.baseAvg,
        };
      });

      const filled = slotMembers.filter(Boolean);
      const laneTotalAvg = filled.reduce((sum, m) => sum + (m.displayAvg || 0), 0);
      const laneMeanAvg =
        filled.length > 0 ? Number((laneTotalAvg / filled.length).toFixed(1)) : 0;

      list.push({
        laneNum,
        slots: slotMembers,
        assignedCount: filled.length,
        laneTotalAvg,
        laneMeanAvg,
      });
    }
    return list;
  }, [currentLanes, effectiveMembers]);

  const activeLaneCount = useMemo(
    () => laneSummaries.filter((l) => l.assignedCount > 0).length,
    [laneSummaries]
  );

  // ==========================================
  // 4. 권한, 임원진 설정(비번 변경/로그아웃) & 학기 초기화 핸들러
  // ==========================================
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setRole('admin');
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      showToast('운영진 모드로 전환되었습니다.');
    } else {
      setPinError('비밀번호가 일치하지 않습니다.');
    }
  };

  const openAdminSettings = () => {
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinChangeError('');
    setShowAdminSettingsModal(true);
  };

  const handleChangeAdminPin = (e) => {
    e.preventDefault();
    if (currentPinInput !== adminPin) {
      setPinChangeError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!/^\d{4,8}$/.test(newPinInput)) {
      setPinChangeError('새 비밀번호는 4~8자리 숫자로 입력해주세요.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setAdminPin(newPinInput);
    syncClubStateToCloud({ adminPin: newPinInput });
    setShowAdminSettingsModal(false);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinChangeError('');
    showToast('임원진 로그인 비밀번호가 변경되어 모든 기기에 반영되었습니다.');
  };

  const handleResetDefaultPin = () => {
    setAdminPin(DEFAULT_ADMIN_PIN);
    syncClubStateToCloud({ adminPin: DEFAULT_ADMIN_PIN });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinChangeError('');
    showToast('임원진 비밀번호가 초기값으로 복원되었습니다.');
  };

  const handleResetDemoData = () => {
    const defaultLastId = INITIAL_SESSIONS[INITIAL_SESSIONS.length - 1].id;
    setCurrentSemesterName('2026-2학기');
    setArchivedSemesters(INITIAL_ARCHIVED_SEMESTERS);
    setMembers(INITIAL_MEMBERS);
    setSessions(INITIAL_SESSIONS);
    setActiveSessionId(defaultLastId);
    setSelectedSemesterId('current');
    setShoeRentalFee(1500);
    setTeams([]);
    syncClubStateToCloud({
      currentSemesterName: '2026-2학기',
      archivedSemesters: INITIAL_ARCHIVED_SEMESTERS,
      members: INITIAL_MEMBERS,
      sessions: INITIAL_SESSIONS,
      shoeRentalFee: 1500,
    });
    setShowAdminSettingsModal(false);
    showToast('초기 샘플 데이터로 복원되어 모든 기기에 동기화되었습니다.');
  };

  const handleSwitchToMemberMode = () => {
    setRole('member');
    setShowAdminSettingsModal(false);
    showToast('로그아웃되어 회원(조회 전용) 모드로 전환되었습니다.');
  };

  const handleFullLogout = () => {
    setRole(null);
    setShowAdminSettingsModal(false);
    setPinInput('');
    setPinError('');
  };

  const handleResetSemester = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const trimmedNextName = nextSemesterName.trim();
    if (!trimmedNextName) return;

    const archivedItem = {
      id: `sem-${Date.now()}`,
      name: currentSemesterName,
      archivedAt: new Date().toISOString().slice(0, 10),
      membersSnapshot: members.map((m) => ({ ...m })),
      sessions: sessions.map((s) => ({
        ...s,
        records: s.records.map((r) => ({ ...r, scores: [...r.scores] })),
      })),
    };

    const nextArchivedList = [archivedItem, ...archivedSemesters];
    setArchivedSemesters(nextArchivedList);

    let updatedMembers = members;
    if (updateBaseAvgFromSemester && allTimeStats.length > 0) {
      const avgMap = new Map(allTimeStats.map((st) => [st.id, Math.round(st.finalAvg)]));
      updatedMembers = members.map((m) => {
        if (avgMap.has(m.id)) {
          const newAvg = avgMap.get(m.id);
          const autoHandi = Math.max(0, Math.round((200 - newAvg) * 0.8));
          return { ...m, baseAvg: newAvg, handicap: autoHandi };
        }
        return m;
      });
      setMembers(updatedMembers);
    }

    const activeList = updatedMembers.filter((m) => m.status !== 'dormant');
    const freshSessionId = `s-${Date.now()}`;
    const freshSession = {
      id: freshSessionId,
      date: nextFirstDate || new Date().toISOString().slice(0, 10),
      title: nextFirstTitle.trim() || `${trimmedNextName} 제1회 정기전`,
      gameFee: currentSession?.gameFee ?? 4500,
      sidePotFee: currentSession?.sidePotFee ?? 2000,
      extraFund: 0,
      lanes: createEmptyLanes(),
      records: activeList.map((m) => ({
        memberId: m.id,
        scores: [0, 0, 0],
        shoeRental: false,
      })),
    };

    setCurrentSemesterName(trimmedNextName);
    setSessions([freshSession]);
    setActiveSessionId(freshSessionId);
    setSelectedSemesterId('current');
    setTeams([]);
    syncClubStateToCloud({
      currentSemesterName: trimmedNextName,
      archivedSemesters: nextArchivedList,
      members: updatedMembers,
      sessions: [freshSession],
    });
    setShowResetSemesterModal(false);
    showToast(`'${archivedItem.name}' 기록이 보관되고 '${trimmedNextName}'가 시작되었습니다.`);
  };

  // ==========================================
  // 5. 회차 관리 & 가변 게임 수 입력 핸들러
  // ==========================================
  const updateCurrentSession = (updater) => {
    if (!isAdmin) return;
    const nextSessions = sessions.map((sess) =>
      sess.id === currentSession.id ? updater(sess) : sess
    );
    setSessions(nextSessions);
    syncClubStateToCloud({ sessions: nextSessions });
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newSessionDate || !newSessionTitle.trim()) return;

    const activeMembers = members.filter((m) => m.status !== 'dormant');
    const newId = `s-${Date.now()}`;
    const created = {
      id: newId,
      date: newSessionDate,
      title: newSessionTitle.trim(),
      gameFee: Number(newSessionGameFee) || 4500,
      sidePotFee: Number(newSessionSidePot) || 0,
      extraFund: 0,
      lanes: createEmptyLanes(),
      records: activeMembers.map((m) => ({
        memberId: m.id,
        scores: [0, 0, 0],
        shoeRental: false,
      })),
    };

    const nextSessions = [...sessions, created];
    setSessions(nextSessions);
    setActiveSessionId(newId);
    syncClubStateToCloud({ sessions: nextSessions });
    setShowNewSessionModal(false);
    setActiveTab('scores');
    showToast(`${newSessionTitle.trim()} 회차가 추가되었습니다.`);
  };

  // 선택한 정기전 회차(전 기록) 영구 삭제 핸들러
  const handleConfirmDeleteSession = () => {
    if (!isAdmin || !deleteTargetSession) return;
    if (sessions.length <= 1) {
      showToast('최소 1개의 정기전 회차는 유지되어야 합니다.');
      setDeleteTargetSession(null);
      return;
    }

    const targetId = deleteTargetSession.id;
    const targetTitle = deleteTargetSession.title;
    const remaining = sessions.filter((s) => s.id !== targetId);
    const sortedRemaining = [...remaining].sort((a, b) => a.date.localeCompare(b.date));

    setSessions(remaining);
    if (activeSessionId === targetId && sortedRemaining.length > 0) {
      setActiveSessionId(sortedRemaining[sortedRemaining.length - 1].id);
    }
    syncClubStateToCloud({ sessions: remaining });
    setDeleteTargetSession(null);
    showToast(`'${targetTitle}' 기록이 삭제되었습니다.`);
  };

  // 보관된 이전 학기 아카이브 영구 삭제 핸들러
  const handleConfirmDeleteSemester = () => {
    if (role !== 'admin' || !deleteTargetSemester) return;
    const targetId = deleteTargetSemester.id;
    const targetName = deleteTargetSemester.name;

    const nextArchived = archivedSemesters.filter((sem) => sem.id !== targetId);
    setArchivedSemesters(nextArchived);
    if (selectedSemesterId === targetId) {
      setSelectedSemesterId('current');
    }
    syncClubStateToCloud({ archivedSemesters: nextArchived });
    setDeleteTargetSemester(null);
    showToast(`보관된 '${targetName}' 기록이 영구 삭제되었습니다.`);
  };

  const handleScoreChange = (memberId, gameIdx, value) => {
    if (!isAdmin) return;
    const numeric = value === '' ? 0 : Math.min(300, Math.max(0, Number(value)));
    updateCurrentSession((sess) => ({
      ...sess,
      records: sess.records.map((rec) => {
        if (rec.memberId !== memberId) return rec;
        const nextScores = [...rec.scores];
        nextScores[gameIdx] = numeric;
        return { ...rec, scores: nextScores };
      }),
    }));
  };

  const handleAddGame = (memberId) => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => ({
      ...sess,
      records: sess.records.map((rec) =>
        rec.memberId === memberId ? { ...rec, scores: [...rec.scores, 0] } : rec
      ),
    }));
  };

  const handleRemoveGame = (memberId, gameIdx) => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => ({
      ...sess,
      records: sess.records.map((rec) => {
        if (rec.memberId !== memberId) return rec;
        if (rec.scores.length <= 1) return rec;
        return {
          ...rec,
          scores: rec.scores.filter((_, idx) => idx !== gameIdx),
        };
      }),
    }));
  };

  const toggleMemberInSession = (memberId) => {
    if (!isAdmin) return;
    const exists = currentSession.records.some((r) => r.memberId === memberId);
    if (exists) {
      updateCurrentSession((sess) => {
        const cleanedLanes = { ...createEmptyLanes(), ...(sess.lanes || {}) };
        for (let i = 1; i <= TOTAL_LANES; i += 1) {
          cleanedLanes[i] = (cleanedLanes[i] || [null, null, null, null]).map((id) =>
            id === memberId ? null : id
          );
        }
        return {
          ...sess,
          lanes: cleanedLanes,
          records: sess.records.filter((r) => r.memberId !== memberId),
        };
      });
    } else {
      updateCurrentSession((sess) => ({
        ...sess,
        records: [...sess.records, { memberId, scores: [0, 0, 0], shoeRental: false }],
      }));
    }
  };

  const toggleShoeRental = (memberId) => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => ({
      ...sess,
      records: sess.records.map((r) =>
        r.memberId === memberId ? { ...r, shoeRental: !r.shoeRental } : r
      ),
    }));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!isAdmin || !newMemberName.trim()) return;
    const id = `m_${Date.now()}`;
    const created = {
      id,
      name: newMemberIsGuest ? `${newMemberName.trim()}(게스트)` : newMemberName.trim(),
      baseAvg: Number(newMemberAvg) || 150,
      handicap: Number(newMemberHandicap) || 0,
      isGuest: newMemberIsGuest,
      status: 'active',
    };
    const nextMembers = [...members, created];
    const nextSessions = sessions.map((sess) =>
      sess.id === currentSession.id
        ? {
            ...sess,
            records: [...sess.records, { memberId: id, scores: [0, 0, 0], shoeRental: false }],
          }
        : sess
    );
    setMembers(nextMembers);
    setSessions(nextSessions);
    syncClubStateToCloud({ members: nextMembers, sessions: nextSessions });
    setNewMemberName('');
    setNewMemberAvg(150);
    setNewMemberHandicap(30);
    setNewMemberIsGuest(false);
    setShowAddMember(false);
    showToast(`${created.name} 회원이 등록되었습니다.`);
  };

  // 휴면 모드 전환 / 활동 복귀 핸들러
  const handleToggleDormantMember = (memberId) => {
    if (!isAdmin) return;
    const target = members.find((m) => m.id === memberId);
    if (!target) return;

    const nextStatus = target.status === 'dormant' ? 'active' : 'dormant';

    const nextMembers = members.map((m) =>
      m.id === memberId ? { ...m, status: nextStatus } : m
    );
    setMembers(nextMembers);

    if (nextStatus === 'dormant') {
      const nextSessions = sessions.map((sess) => {
        if (sess.id !== currentSession.id) return sess;
        const cleanedLanes = { ...createEmptyLanes(), ...(sess.lanes || {}) };
        for (let i = 1; i <= TOTAL_LANES; i += 1) {
          cleanedLanes[i] = (cleanedLanes[i] || [null, null, null, null]).map((id) =>
            id === memberId ? null : id
          );
        }
        return {
          ...sess,
          lanes: cleanedLanes,
          records: sess.records.filter((r) => r.memberId !== memberId),
        };
      });
      setSessions(nextSessions);
      setTeams((prev) => prev.map((t) => t.filter((m) => m.id !== memberId)));
      syncClubStateToCloud({ members: nextMembers, sessions: nextSessions });
      showToast(`${target.name} 회원이 휴면 모드로 전환되었습니다. (이전 기록 보존)`);
    } else {
      syncClubStateToCloud({ members: nextMembers });
      showToast(`${target.name} 회원이 활동중으로 복귀했습니다.`);
    }
  };

  // 회원 영구 삭제 핸들러
  const handleConfirmDeleteMember = () => {
    if (!isAdmin || !deleteTargetMember) return;
    const targetId = deleteTargetMember.id;
    const targetName = deleteTargetMember.name;

    const nextMembers = members.filter((m) => m.id !== targetId);
    const nextSessions = sessions.map((sess) => {
      const cleanedLanes = { ...createEmptyLanes(), ...(sess.lanes || {}) };
      for (let i = 1; i <= TOTAL_LANES; i += 1) {
        cleanedLanes[i] = (cleanedLanes[i] || [null, null, null, null]).map((id) =>
          id === targetId ? null : id
        );
      }
      return {
        ...sess,
        lanes: cleanedLanes,
        records: sess.records.filter((r) => r.memberId !== targetId),
      };
    });

    setMembers(nextMembers);
    setSessions(nextSessions);
    setTeams((prev) => prev.map((team) => team.filter((m) => m.id !== targetId)));
    syncClubStateToCloud({ members: nextMembers, sessions: nextSessions });

    setDeleteTargetMember(null);
    showToast(`${targetName} 회원이 영구 삭제되었습니다.`);
  };

  const updateMemberField = (memberId, field, value) => {
    if (!isAdmin) return;
    const nextMembers = members.map((m) => (m.id === memberId ? { ...m, [field]: value } : m));
    setMembers(nextMembers);
    syncClubStateToCloud({ members: nextMembers });
  };

  // ==========================================
  // 6. 레인 배정표 조작 및 PNG 이미지 변환 핸들러
  // ==========================================
  const handleAssignMemberToLaneSlot = (laneNum, slotIdx, memberId) => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => {
      const nextLanes = { ...createEmptyLanes(), ...(sess.lanes || {}) };
      for (let i = 1; i <= TOTAL_LANES; i += 1) {
        nextLanes[i] = [...(nextLanes[i] || [null, null, null, null])].map((id) =>
          id === memberId ? null : id
        );
      }
      nextLanes[laneNum][slotIdx] = memberId;
      return { ...sess, lanes: nextLanes };
    });
    setAssignModalTarget(null);
  };

  const handleRemoveMemberFromLaneSlot = (laneNum, slotIdx) => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => {
      const nextLanes = { ...createEmptyLanes(), ...(sess.lanes || {}) };
      const row = [...(nextLanes[laneNum] || [null, null, null, null])];
      row[slotIdx] = null;
      nextLanes[laneNum] = row;
      return { ...sess, lanes: nextLanes };
    });
  };

  const handleClearAllLanes = () => {
    if (!isAdmin) return;
    updateCurrentSession((sess) => ({
      ...sess,
      lanes: createEmptyLanes(),
    }));
    showToast('모든 레인 배정이 초기화되었습니다.');
  };

  const handleAutoAssignLanes = () => {
    if (!isAdmin) return;
    const activeMembers = effectiveMembers.filter((m) => m.status !== 'dormant');
    if (activeMembers.length === 0) return;

    const startIdx = Math.max(1, Math.min(TOTAL_LANES, Number(startLaneNum) || 1));
    const maxCapacity = (TOTAL_LANES - startIdx + 1) * SLOTS_PER_LANE;
    const pool = activeMembers.slice(0, maxCapacity);
    const nextLanes = createEmptyLanes();

    if (laneAssignMode === 'teams' && teams.length > 0) {
      let currentLane = startIdx;
      teams.forEach((team) => {
        team.forEach((member, idx) => {
          const targetLane = currentLane + Math.floor(idx / SLOTS_PER_LANE);
          const targetSlot = idx % SLOTS_PER_LANE;
          if (targetLane <= TOTAL_LANES) {
            nextLanes[targetLane][targetSlot] = member.id;
          }
        });
        currentLane += Math.max(1, Math.ceil(team.length / SLOTS_PER_LANE));
      });
    } else if (laneAssignMode === 'random') {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      shuffled.forEach((member, idx) => {
        const laneOffset = Math.floor(idx / SLOTS_PER_LANE);
        const slotIdx = idx % SLOTS_PER_LANE;
        const targetLane = startIdx + laneOffset;
        if (targetLane <= TOTAL_LANES) {
          nextLanes[targetLane][slotIdx] = member.id;
        }
      });
    } else {
      const neededLanes = Math.ceil(pool.length / SLOTS_PER_LANE);
      const sorted = [...pool].sort((a, b) => b.baseAvg - a.baseAvg);
      const buckets = Array.from({ length: neededLanes }, () => []);

      sorted.forEach((member, idx) => {
        const round = Math.floor(idx / neededLanes);
        const pos = idx % neededLanes;
        const bucketIdx = round % 2 === 0 ? pos : neededLanes - 1 - pos;
        buckets[bucketIdx].push(member);
      });

      buckets.forEach((bucket, bIdx) => {
        const targetLane = startIdx + bIdx;
        if (targetLane <= TOTAL_LANES) {
          bucket.forEach((member, sIdx) => {
            if (sIdx < SLOTS_PER_LANE) {
              nextLanes[targetLane][sIdx] = member.id;
            }
          });
        }
      });
    }

    updateCurrentSession((sess) => ({
      ...sess,
      lanes: nextLanes,
    }));
    showToast(`${startIdx}레인부터 자동 레인 배정이 완료되었습니다.`);
  };

  // 레인표 텍스트 복사
  const handleCopyLaneText = async () => {
    const activeLanes = laneSummaries.filter((l) => l.assignedCount > 0);
    if (activeLanes.length === 0) {
      showToast('배정된 레인이 없습니다.');
      return;
    }

    const lines = [
      `🎳 [KOBO 볼링 클럽 레인 배정표]`,
      `📅 ${currentSession.date} · ${currentSession.title}`,
      `📍 사용 레인: ${activeLanes.length}개 레인 (총 ${assignedMemberIds.size}명)`,
      `────────────────────`,
      ...activeLanes.map((lane) => {
        const membersText = lane.slots
          .map((m, i) => (m ? `${i + 1}번 ${m.name}(에버 ${m.displayAvg})` : `${i + 1}번 공석`))
          .join(' / ');
        return `▪ ${lane.laneNum}레인 (레인 평균 에버 ${lane.laneMeanAvg})\n  ${membersText}`;
      }),
    ];

    const fullText = lines.join('\n');
    const success = await copyTextSafely(fullText);

    if (success) {
      showToast('레인 배정표 텍스트가 복사되었습니다!');
    } else {
      setManualTextModal({
        title: '레인 배정표 텍스트',
        text: fullText,
      });
    }
  };

  // 레인표 전체를 한 장의 PNG 이미지로 변환 (화이트 테마)
  const handleGenerateLaneImage = () => {
    const targetLanes =
      laneFilter === 'all'
        ? laneSummaries
        : laneSummaries.filter((l) => l.assignedCount > 0);

    const displayLanes = targetLanes.length > 0 ? targetLanes : laneSummaries.slice(0, 4);

    const scale = 2;
    const cols = 2;
    const rows = Math.ceil(displayLanes.length / cols);
    const canvasWidth = 920;
    const headerHeight = 136;
    const cardWidth = 420;
    const cardHeight = 224;
    const gapX = 24;
    const gapY = 20;
    const paddingX = 28;
    const footerHeight = 52;
    const canvasHeight =
      headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gapY + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    const drawRoundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 전체 배경 (클린 화이트)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 상단 헤더 카드
    const headerGrad = ctx.createLinearGradient(paddingX, 18, canvasWidth - paddingX, 118);
    headerGrad.addColorStop(0, '#1D4ED8');
    headerGrad.addColorStop(1, '#312E81');
    drawRoundRect(paddingX, 18, canvasWidth - paddingX * 2, 100, 18);
    ctx.fillStyle = headerGrad;
    ctx.fill();

    ctx.fillStyle = '#BFDBFE';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KOBO BOWLING CLUB · LANE ASSIGNMENT', paddingX + 22, 46);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${currentSession.title} 레인 배정표`, paddingX + 22, 76);

    ctx.fillStyle = '#DBEAFE';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      `일시: ${currentSession.date}   |   사용 레인: ${activeLaneCount} / ${TOTAL_LANES}레인   |   배정 인원: ${assignedMemberIds.size}명`,
      paddingX + 22,
      102
    );

    // 레인 카드 그리기 (에버만 표시)
    displayLanes.forEach((lane, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = paddingX + col * (cardWidth + gapX);
      const y = headerHeight + row * (cardHeight + gapY);

      drawRoundRect(x, y, cardWidth, cardHeight, 16);
      ctx.fillStyle = lane.assignedCount > 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = lane.assignedCount > 0 ? '#CBD5E1' : '#E2E8F0';
      ctx.stroke();

      // 카드 헤더 바
      ctx.fillStyle = lane.assignedCount > 0 ? '#EFF6FF' : '#F1F5F9';
      drawRoundRect(x + 1, y + 1, cardWidth - 2, 42, 15);
      ctx.fill();

      // 레인 번호 배지
      drawRoundRect(x + 14, y + 8, 66, 26, 8);
      ctx.fillStyle = lane.assignedCount > 0 ? '#2563EB' : '#94A3B8';
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${lane.laneNum}레인`, x + 28, y + 26);

      // 레인 평균 에버
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      const summaryLabel =
        lane.assignedCount > 0
          ? `${lane.assignedCount}/4명 · 평균 에버 ${lane.laneMeanAvg}`
          : '미배정 공석';
      ctx.fillText(summaryLabel, x + 90, y + 26);

      // 4개 슬롯 행 (이름 + 에버만 표시)
      lane.slots.forEach((member, sIdx) => {
        const slotY = y + 52 + sIdx * 40;
        drawRoundRect(x + 14, slotY, cardWidth - 28, 33, 8);
        ctx.fillStyle = member ? '#F8FAFC' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = member ? '#E2E8F0' : '#F1F5F9';
        ctx.stroke();

        ctx.fillStyle = member ? '#2563EB' : '#94A3B8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${sIdx + 1}번`, x + 24, slotY + 21);

        if (member) {
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(member.name, x + 58, slotY + 21);

          ctx.fillStyle = '#2563EB';
          ctx.font = 'bold 13px sans-serif';
          const avgText = `에버 ${member.displayAvg}`;
          const textWidth = ctx.measureText(avgText).width;
          ctx.fillText(avgText, x + cardWidth - 28 - textWidth, slotY + 21);
        } else {
          ctx.fillStyle = '#94A3B8';
          ctx.font = '12px sans-serif';
          ctx.fillText('빈 자리', x + 58, slotY + 21);
        }
      });
    });

    // 하단 워터마크
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `Generated by KOBO 볼링 클럽 기록 및 정산 시스템 · ${currentSession.date}`,
      paddingX,
      canvasHeight - 18
    );

    const dataUrl = canvas.toDataURL('image/png');
    setLanePreviewImage(dataUrl);
  };

  // ==========================================
  // 7. 팀 짜기 로직 (스네이크 드래프트)
  // ==========================================
  const generateBalancedTeams = () => {
    const activePlayers = sessionStats.filter((m) => m.status !== 'dormant');
    if (activePlayers.length === 0) return;
    const count = Math.max(2, Math.min(8, Number(teamCount) || 2));
    const sorted = [...activePlayers].sort((a, b) => b.baseAvg - a.baseAvg);
    const buckets = Array.from({ length: count }, () => []);

    sorted.forEach((player, idx) => {
      const round = Math.floor(idx / count);
      const pos = idx % count;
      const teamIdx = round % 2 === 0 ? pos : count - 1 - pos;
      buckets[teamIdx].push(player);
    });

    setTeams(buckets);
    showToast(`${count}개 밸런스 팀 편성이 완료되었습니다.`);
  };

  // ==========================================
  // 8. 판수 비례 자동 정산 계산
  // ==========================================
  const settlementData = useMemo(() => {
    if (!currentSession) return { rows: [], grandTotal: 0, totalGamesPlayed: 0 };
    const totalGamesPlayed = sessionStats.reduce((sum, p) => sum + p.gameCount, 0);
    const extraPerPerson =
      sessionStats.length > 0
        ? Math.ceil(currentSession.extraFund / sessionStats.length / 100) * 100
        : 0;

    const rows = sessionStats.map((player) => {
      const gameCost = currentSession.gameFee * player.gameCount;
      const shoeCost = player.shoeRental ? shoeRentalFee : 0;
      const sideCost = currentSession.sidePotFee;
      const total = gameCost + shoeCost + sideCost + extraPerPerson;

      return {
        ...player,
        gameCost,
        shoeCost,
        sideCost,
        extraPerPerson,
        total,
      };
    });

    const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);
    return { rows, grandTotal, totalGamesPlayed };
  }, [currentSession, sessionStats, shoeRentalFee]);

  const handleCopySettlement = async () => {
    const lines = [
      `🎳 [KOBO 볼링 클럽 정산 안내]`,
      `📅 ${currentSession.date} (${currentSession.title})`,
      `👥 참석: ${settlementData.rows.length}명 / 총 ${settlementData.totalGamesPlayed}게임`,
      `💰 게임비: 판당 ${currentSession.gameFee.toLocaleString()}원 / 사이드: ${currentSession.sidePotFee.toLocaleString()}원`,
      `────────────────────`,
      ...settlementData.rows.map(
        (r) =>
          `• ${r.name} (${r.gameCount}G): ${r.total.toLocaleString()}원${
            r.shoeRental ? ' (대화료 포함)' : ''
          }`
      ),
      `────────────────────`,
      `총 합계: ${settlementData.grandTotal.toLocaleString()}원`,
    ];

    const fullText = lines.join('\n');
    const success = await copyTextSafely(fullText);

    if (success) {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
      showToast('정산 내역이 클립보드에 복사되었습니다!');
    } else {
      setManualTextModal({
        title: '정산 내역 텍스트',
        text: fullText,
      });
    }
  };

  // 필터링된 회원 관리 리스트
  const filteredMembersList = useMemo(() => {
    return effectiveMembers.filter((m) => {
      if (memberFilter === 'active') return m.status !== 'dormant';
      if (memberFilter === 'dormant') return m.status === 'dormant';
      return true;
    });
  }, [effectiveMembers, memberFilter]);

  // ==========================================
  // 초기 입장 모드 선택 화면 (회원 vs 운영진 - 화이트 테마)
  // ==========================================
  if (!role) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4 text-3xl text-white">
              🎳
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
              KOBO BOWLING CLUB
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              KOBO 볼링 클럽
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              실시간 클라우드 공유 · 정기전 기록, 레인표 및 정산
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setRole('member')}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base text-slate-900 flex items-center gap-2 whitespace-nowrap">
                    회원 입장하기
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                      조회 전용
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    정기전 순위, 레인표, 전체 기록 및 정산 내역 확인
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              onClick={() => {
                setPinInput('');
                setPinError('');
                setShowPinModal(true);
              }}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all text-left shadow-lg shadow-blue-600/20 text-white"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base flex items-center gap-2 whitespace-nowrap">
                    운영진 입장하기
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      관리자
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5 truncate">
                    점수 입력, 16레인 배정, 학기 초기화 및 회원 관리
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* PIN 입력 모달 */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handlePinSubmit}
              className="w-full max-w-xs bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" /> 운영진 인증
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                운영진 전용 비밀번호를 입력하세요.
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.5em] font-black py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-medium mt-2">{pinError}</p>
              )}
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20"
              >
                운영진 모드로 입장
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 메인 애플리케이션 화면 (클린 화이트 테마)
  // ==========================================
  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      {/* 상단 고정 헤더 & 회차 선택 바 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shrink-0 shadow-xs">
              🎳
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base tracking-tight text-slate-900 truncate">
                  KOBO 볼링 클럽
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap">
                    <Unlock className="w-3 h-3" /> 운영진
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                    <Eye className="w-3 h-3" /> 회원
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentSession?.date} · {currentSession?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {role === 'admin' ? (
              <>
                <button
                  onClick={openAdminSettings}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                  title="임원진 비밀번호 변경 및 설정"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">설정</span>
                </button>
                <button
                  onClick={handleFullLogout}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                  title="임원진 로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                  setShowPinModal(true);
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 whitespace-nowrap shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>운영진</span>
              </button>
            )}
          </div>
        </div>

        {/* 학기 선택기 + 정기전 회차(날짜) 선택기 바 */}
        <div className="bg-slate-50/80 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-2 space-y-1.5">
            {/* 1줄: 학기 선택기 및 새 학기 초기화 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Archive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <select
                  value={selectedSemesterId}
                  onChange={(e) => setSelectedSemesterId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-extrabold text-indigo-700 outline-none focus:border-indigo-500 truncate max-w-[210px]"
                >
                  <option value="current">📚 {currentSemesterName} (진행중)</option>
                  {archivedSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      📦 {sem.name} (보관됨 · {sem.sessions.length}회차)
                    </option>
                  ))}
                </select>
                {isArchivedSemester && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                    이전 학기 아카이브
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setNextSemesterName('');
                    setShowResetSemesterModal(true);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" /> 새 학기 초기화
                </button>
              )}

              {role === 'admin' && isArchivedSemester && activeArchivedSemester && (
                <button
                  type="button"
                  onClick={() => setDeleteTargetSemester(activeArchivedSemester)}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" /> 이전 학기 삭제
                </button>
              )}
            </div>

            {/* 2줄: 해당 학기 내 정기전 회차 선택 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={currentSession?.id || ''}
                  onChange={(e) => setActiveSessionId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 truncate max-w-[230px]"
                >
                  {[...sortedSessions].reverse().map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.date} · {sess.title} ({sess.records.length}명)
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {sortedSessions.length > 1 && currentSession && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetSession(currentSession)}
                      title="현재 선택된 회차 기록 삭제"
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" /> 회차 삭제
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewSessionModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xs whitespace-nowrap"
                  >
                    <FolderPlus className="w-3 h-3" /> 새 회차
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 이전 학기 아카이브 열람 안내 배너 */}
      {isArchivedSemester && activeArchivedSemester && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 min-w-0">
              <History className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate font-semibold">
                현재 보관된 <strong>{activeArchivedSemester.name}</strong> 기록을 열람 중입니다.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setDeleteTargetSemester(activeArchivedSemester)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 whitespace-nowrap flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> 기록 삭제
                </button>
              )}
              <button
                onClick={() => setSelectedSemesterId('current')}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 whitespace-nowrap"
              >
                현재 학기 복귀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 메인 콘텐츠 컨테이너 */}
      <main className="max-w-4xl mx-auto px-4 pt-4">
        {/* ============================================================
            탭 1: 기록 / 랭킹 (해당 회차 에버 TOP 10 + 학기 전체 상세 기록 통합표)
           ============================================================ */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-5">
            {/* 상단 요약 카드 (선택한 해당 정기전 회차 기준) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 block whitespace-nowrap">
                  회차 참석 · 판수
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                    {sessionStats.length}
                  </span>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    명 / {settlementData.totalGamesPlayed}G
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3.5 text-white shadow-sm">
                <span className="text-[11px] font-bold text-blue-100 block whitespace-nowrap">
                  회차 에버 1위
                </span>
                <div className="mt-1 font-black text-base sm:text-lg truncate">
                  {sessionTop10[0]?.name || '-'}
                </div>
                <div className="text-[11px] font-bold text-blue-100 tabular-nums whitespace-nowrap">
                  {sessionTop10[0] ? `에버 ${sessionTop10[0].finalAvg}` : '기록 없음'}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 block whitespace-nowrap">
                  회차 최고 하이
                </span>
                {(() => {
                  const highPlayer = [...sessionStats].sort((a, b) => b.highGame - a.highGame)[0];
                  return (
                    <>
                      <div className="mt-1 text-lg sm:text-xl font-black text-amber-600 tabular-nums">
                        {highPlayer?.highGame || 0}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 truncate">
                        {highPlayer?.name || '-'}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 해당 정기전 회차 에버 1~10위 리더보드 */}
            <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-sm text-slate-900 truncate">
                      {currentSession?.title} 에버리지 TOP 10
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentSession?.date} 정기전 에버 순위 (1위~10위)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">
                  핸디 포함 에버 기준
                </span>
              </div>

              {sessionTop10.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  해당 회차에 등록된 기록이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sessionTop10.map((player, idx) => {
                    const rank = idx + 1;
                    const badgeStyle =
                      rank === 1
                        ? 'bg-amber-400 text-amber-950 shadow-2xs'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600';

                    return (
                      <div
                        key={player.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${badgeStyle}`}
                          >
                            {rank}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900 truncate">
                                {player.name}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap shrink-0">
                                {player.gameCount}G
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 tabular-nums truncate">
                              점수: {player.scores.join(' · ')} (하이 {player.highGame})
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-blue-600 tabular-nums whitespace-nowrap">
                            {player.finalAvg}
                          </div>
                          <div
                            className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${
                              player.avgDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {player.avgDiff >= 0 ? `▲ +${player.avgDiff}` : `▼ ${player.avgDiff}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 하단 영역: 전체 상세 기록 (해당 학기 이때까지 친 모든 회차 통합) */}
            <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h2 className="font-black text-sm text-slate-900 truncate">
                      전체 상세 기록 ({isArchivedSemester ? activeArchivedSemester?.name : currentSemesterName} 통산)
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    이때까지 친 총 {sortedSessions.length}개 정기전 회차 기록 전체 합산
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none"
                  >
                    <option value="avg">통산 에버순</option>
                    <option value="total">통산 총점순</option>
                    <option value="high">최고 하이순</option>
                    <option value="games">총 판수순</option>
                  </select>

                  <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
                    <button
                      onClick={() => setRankingViewMode('table')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
                        rankingViewMode === 'table'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      상세표
                    </button>
                    <button
                      onClick={() => setRankingViewMode('cards')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
                        rankingViewMode === 'cards'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      카드형
                    </button>
                  </div>
                </div>
              </div>

              {allTimeStats.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  누적된 기록이 없습니다.
                </div>
              ) : rankingViewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="sticky left-0 z-10 bg-slate-50 py-2.5 pl-3.5 pr-2 whitespace-nowrap">
                          순위 / 이름
                        </th>
                        <th className="py-2.5 px-2 text-center whitespace-nowrap">출석/판수</th>
                        <th className="py-2.5 px-2 text-right whitespace-nowrap">순수합</th>
                        <th className="py-2.5 px-2 text-right whitespace-nowrap">핸디합</th>
                        <th className="py-2.5 px-2 text-right whitespace-nowrap">통산총점</th>
                        <th className="py-2.5 px-2 text-right text-blue-600 whitespace-nowrap">
                          통산에버
                        </th>
                        <th className="py-2.5 px-2 text-center whitespace-nowrap">하이</th>
                        <th className="py-2.5 px-2 text-right whitespace-nowrap">증감</th>
                        <th className="py-2.5 pl-2 pr-3.5 whitespace-nowrap">회차별 점수 이력</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allTimeStats.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/80">
                          <td className="sticky left-0 z-10 bg-white py-2.5 pl-3.5 pr-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 text-center font-black text-slate-400 tabular-nums">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900">{st.name}</span>
                              {st.status === 'dormant' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  휴면
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums whitespace-nowrap text-slate-600">
                            {st.sessionCount}회 · <strong>{st.totalGames}G</strong>
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap text-slate-700">
                            {st.rawTotal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap text-slate-500">
                            +{st.totalHandicap}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold tabular-nums whitespace-nowrap text-slate-900">
                            {st.finalTotal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black tabular-nums whitespace-nowrap text-blue-600">
                            {st.finalAvg}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold tabular-nums whitespace-nowrap text-amber-600">
                            {st.highGame}
                          </td>
                          <td
                            className={`py-2.5 px-2 text-right font-bold tabular-nums whitespace-nowrap ${
                              st.avgDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {st.avgDiff >= 0 ? `+${st.avgDiff}` : st.avgDiff}
                          </td>
                          <td className="py-2.5 pl-2 pr-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {st.sessionHistory.map((h) => (
                                <span
                                  key={h.sessionId}
                                  className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 tabular-nums"
                                >
                                  {h.title.replace('정기전', '').trim()}: {h.scores.join('/')}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {allTimeSummaryRow && (
                      <tfoot>
                        <tr className="bg-blue-50/70 border-t-2 border-blue-200 font-extrabold text-slate-800">
                          <td className="sticky left-0 z-10 bg-blue-50 py-2.5 pl-3.5 pr-2 whitespace-nowrap">
                            전체 평균 ({allTimeSummaryRow.totalMembers}명)
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums whitespace-nowrap">
                            총 {allTimeSummaryRow.totalGames}G
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">
                            {allTimeSummaryRow.avgRaw.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">
                            +{allTimeSummaryRow.avgHandi}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">
                            {allTimeSummaryRow.avgFinal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right text-blue-700 tabular-nums whitespace-nowrap">
                            {allTimeSummaryRow.avgOfAvgs}
                          </td>
                          <td className="py-2.5 px-2 text-center text-amber-700 tabular-nums whitespace-nowrap">
                            {allTimeSummaryRow.maxHigh}
                          </td>
                          <td colSpan={2} className="py-2.5 px-2 text-right text-[11px] text-slate-500">
                            전체 회차 통합 집계
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allTimeStats.map((st, idx) => (
                    <div
                      key={st.id}
                      className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {st.name}
                          </span>
                        </div>
                        <span className="text-base font-black text-blue-600 tabular-nums whitespace-nowrap">
                          에버 {st.finalAvg}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 rounded-xl p-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">출석/판수</span>
                          <strong className="text-slate-800 tabular-nums">
                            {st.sessionCount}회 / {st.totalGames}G
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">통산 총점</span>
                          <strong className="text-slate-800 tabular-nums">
                            {st.finalTotal.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">최고 하이</span>
                          <strong className="text-amber-600 tabular-nums">{st.highGame}</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {st.sessionHistory.map((h) => (
                          <span
                            key={h.sessionId}
                            className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600 tabular-nums"
                          >
                            {h.title}: {h.scores.join(' · ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================
            탭 2: 점수 입력 (가변 게임 수 & 당일 참석자 관리)
           ============================================================ */}
        {activeTab === 'scores' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-black text-base text-slate-900">
                    {currentSession?.title} 점수 입력
                  </h2>
                  <p className="text-xs text-slate-500">
                    개인별로 게임 추가/삭제가 가능하며 자동으로 에버와 정산에 반영됩니다.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 회원 등록
                  </button>
                )}
              </div>

              {/* 당일 참석자 토글 칩 (운영진 전용) */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">
                    당일 참석 인원 선택 (클릭하여 참석/제외 전환 · 휴면 회원 제외)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {members
                      .filter((m) => m.status !== 'dormant')
                      .map((m) => {
                        const isJoined = currentSession?.records.some((r) => r.memberId === m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMemberInSession(m.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                              isJoined
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isJoined ? '✓ ' : '+ '}
                            {m.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {!isAdmin && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>회원 조회 전용 모드입니다. 점수 수정은 운영진 로그인 후 가능합니다.</span>
              </div>
            )}

            {/* 참석자별 점수 입력 카드 목록 */}
            <div className="space-y-3">
              {sessionStats.map((player) => (
                <div
                  key={player.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {player.name}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap shrink-0">
                        기준 {player.baseAvg} · 핸디 +{player.handicap}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-blue-600 tabular-nums whitespace-nowrap">
                          에버 {player.finalAvg}
                        </span>
                        <span className="text-[11px] text-slate-400 block tabular-nums whitespace-nowrap">
                          총점 {player.finalTotal}
                        </span>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetMember(player)}
                          title="회원 관리(휴면/삭제)"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 게임별 점수 입력칸 */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {player.scores.map((sc, gIdx) => (
                      <div
                        key={gIdx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center relative"
                      >
                        <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>{gIdx + 1}G</span>
                          {isAdmin && player.scores.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGame(player.id, gIdx)}
                              className="text-slate-400 hover:text-rose-600"
                              title="이 게임 삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          disabled={!isAdmin}
                          value={sc === 0 ? '' : sc}
                          placeholder="0"
                          onChange={(e) => handleScoreChange(player.id, gIdx, e.target.value)}
                          className="w-full text-center font-black text-base text-slate-900 bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-blue-500 disabled:bg-slate-100 tabular-nums"
                        />
                      </div>
                    ))}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleAddGame(player.id)}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl p-2 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-colors min-h-[66px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[11px] font-bold mt-0.5 whitespace-nowrap">
                          게임 추가
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 하단 옵션: 대화료 체크 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={player.shoeRental}
                        onChange={() => toggleShoeRental(player.id)}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-slate-600">
                        대화료(볼링화 대여) 포함
                      </span>
                    </label>
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                      순수합 {player.rawTotal} + 핸디 {player.totalHandicap}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            탭 3: 16레인 × 4인 레인표 배정 (에버만 표시 + PNG 이미지 저장)
           ============================================================ */}
        {activeTab === 'lanes' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-base text-slate-900">
                    16레인 배정표 ({activeLaneCount}개 레인 · {assignedMemberIds.size}명 배정)
                  </h2>
                  <p className="text-xs text-slate-500">
                    레인 배정 시 회원 이름과 에버리지 정보만 깔끔하게 표시됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLaneText}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" /> 텍스트 복사
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateLaneImage}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs whitespace-nowrap"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> 이미지로 한눈에 보기
                  </button>
                </div>
              </div>

              {/* 운영진 자동 배정 및 필터 바 */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLaneFilter('assigned')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                      laneFilter === 'assigned'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    배정된 레인만 ({activeLaneCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaneFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                      laneFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    전체 1~16레인
                  </button>
                </div>

                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
                      <span className="text-slate-500 font-bold whitespace-nowrap">시작레인</span>
                      <input
                        type="number"
                        min={1}
                        max={16}
                        value={startLaneNum}
                        onChange={(e) => setStartLaneNum(e.target.value)}
                        className="w-10 text-center font-black bg-white border border-slate-200 rounded py-0.5"
                      />
                    </div>

                    <select
                      value={laneAssignMode}
                      onChange={(e) => setLaneAssignMode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="balanced">에버 균형 배정</option>
                      <option value="random">랜덤 섞기 배정</option>
                      <option value="teams">편성된 팀별 배정</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAutoAssignLanes}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold whitespace-nowrap"
                    >
                      자동 배정
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllLanes}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold whitespace-nowrap"
                    >
                      초기화
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 레인 카드 그리드 */}
            {(() => {
              const displayedLanes =
                laneFilter === 'all'
                  ? laneSummaries
                  : laneSummaries.filter((l) => l.assignedCount > 0);

              if (displayedLanes.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-700">
                      아직 배정된 레인이 없습니다.
                    </p>
                    <p className="text-xs text-slate-500">
                      상단의 [전체 1~16레인]을 눌러 직접 슬롯에 배정하거나 [자동 배정]을 실행하세요.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayedLanes.map((lane) => (
                    <div
                      key={lane.laneNum}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                    >
                      <div className="px-3.5 py-2.5 bg-blue-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs whitespace-nowrap">
                            {lane.laneNum}레인
                          </span>
                          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                            {lane.assignedCount}/4명
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-blue-700 tabular-nums whitespace-nowrap">
                          {lane.assignedCount > 0 ? `평균 에버 ${lane.laneMeanAvg}` : '공석'}
                        </span>
                      </div>

                      <div className="p-3 space-y-1.5">
                        {lane.slots.map((member, slotIdx) => (
                          <div
                            key={slotIdx}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[11px] font-black text-blue-600 shrink-0 whitespace-nowrap">
                                {slotIdx + 1}번
                              </span>
                              {member ? (
                                <span className="font-bold text-sm text-slate-900 truncate">
                                  {member.name}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">빈 자리</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {member ? (
                                <>
                                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 tabular-nums whitespace-nowrap">
                                    에버 {member.displayAvg}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveMemberFromLaneSlot(lane.laneNum, slotIdx)
                                      }
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      title="슬롯에서 제외"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAssignModalTarget({ laneNum: lane.laneNum, slotIdx })
                                    }
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 whitespace-nowrap"
                                  >
                                    + 배정
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ============================================================
            탭 4: 밸런스 팀짜기
           ============================================================ */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-base text-slate-900">에버 밸런스 팀 편성</h2>
                <p className="text-xs text-slate-500">
                  당일 참석 인원({sessionStats.filter((m) => m.status !== 'dormant').length}명)을 기준 에버 스네이크 방식으로 균등 배분합니다.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="font-bold text-slate-500 whitespace-nowrap">팀 수</span>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={teamCount}
                    onChange={(e) => setTeamCount(e.target.value)}
                    className="w-10 text-center font-black bg-white border border-slate-200 rounded py-0.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateBalancedTeams}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-2xs whitespace-nowrap"
                >
                  <Shuffle className="w-3.5 h-3.5" /> 팀 자동 편성
                </button>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-xs text-slate-400">
                상단의 <strong>[팀 자동 편성]</strong> 버튼을 눌러 팀을 구성해보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((team, idx) => {
                  const totalBase = team.reduce((s, m) => s + m.baseAvg, 0);
                  const meanBase =
                    team.length > 0 ? Number((totalBase / team.length).toFixed(1)) : 0;

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                    >
                      <div className="px-4 py-2.5 bg-indigo-50/70 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-black text-sm text-indigo-900">
                          {idx + 1}팀 ({team.length}명)
                        </span>
                        <span className="text-xs font-extrabold text-indigo-600 tabular-nums">
                          평균 에버 {meanBase}
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {team.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-xs"
                          >
                            <span className="font-bold text-slate-900">{m.name}</span>
                            <span className="font-extrabold text-blue-600 tabular-nums">
                              에버 {m.baseAvg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            탭 5: 자동 정산
           ============================================================ */}
        {activeTab === 'settlement' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-base text-slate-900">
                    {currentSession?.title} 자동 정산
                  </h2>
                  <p className="text-xs text-slate-500">
                    개인별 실제 친 게임 수(판수)와 대화료 여부를 반영해 자동 계산됩니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySettlement}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-2xs whitespace-nowrap"
                >
                  {copiedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 복사 완료
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" /> 카톡 정산문 복사
                    </>
                  )}
                </button>
              </div>

              {/* 운영진 정산 단가 설정 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block">1게임비</span>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={currentSession?.gameFee ?? 4500}
                    onChange={(e) =>
                      updateCurrentSession((s) => ({ ...s, gameFee: Number(e.target.value) || 0 }))
                    }
                    className="w-full mt-1 font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 tabular-nums"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block">사이드비</span>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={currentSession?.sidePotFee ?? 2000}
                    onChange={(e) =>
                      updateCurrentSession((s) => ({
                        ...s,
                        sidePotFee: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full mt-1 font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 tabular-nums"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block">대화료</span>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={shoeRentalFee}
                    onChange={(e) => {
                      const nextFee = Number(e.target.value) || 0;
                      setShoeRentalFee(nextFee);
                      syncClubStateToCloud({ shoeRentalFee: nextFee });
                    }}
                    className="w-full mt-1 font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 tabular-nums"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block">추가 공금(N빵)</span>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={currentSession?.extraFund ?? 0}
                    onChange={(e) =>
                      updateCurrentSession((s) => ({
                        ...s,
                        extraFund: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full mt-1 font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* 정산 명세 리스트 */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-blue-50/70 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">
                  총 {settlementData.rows.length}명 · {settlementData.totalGamesPlayed}게임
                </span>
                <span className="text-sm font-black text-blue-700 tabular-nums">
                  총 합계 {settlementData.grandTotal.toLocaleString()}원
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {settlementData.rows.map((row) => (
                  <div
                    key={row.id}
                    className="px-4 py-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {row.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] whitespace-nowrap">
                          {row.gameCount}G
                        </span>
                        {row.shoeRental && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] whitespace-nowrap">
                            대화료
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums truncate">
                        게임 {row.gameCost.toLocaleString()} + 사이드 {row.sideCost.toLocaleString()}
                        {row.shoeCost > 0 ? ` + 대화 ${row.shoeCost.toLocaleString()}` : ''}
                        {row.extraPerPerson > 0
                          ? ` + 공금 ${row.extraPerPerson.toLocaleString()}`
                          : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 tabular-nums whitespace-nowrap">
                        {row.total.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            탭 6: 회원 관리 (휴면 모드 전환 / 영구 삭제 / 기준 에버·핸디 수정)
           ============================================================ */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-base text-slate-900">
                    클럽 회원 관리 ({effectiveMembers.length}명)
                  </h2>
                  <p className="text-xs text-slate-500">
                    휴면 전환 시 기존 기록은 보존되며 당일 참석·레인·팀 배정에서만 제외됩니다.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 신규 등록
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                {[
                  { id: 'all', label: `전체 (${effectiveMembers.length})` },
                  {
                    id: 'active',
                    label: `활동중 (${effectiveMembers.filter((m) => m.status !== 'dormant').length})`,
                  },
                  {
                    id: 'dormant',
                    label: `휴면 (${effectiveMembers.filter((m) => m.status === 'dormant').length})`,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMemberFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                      memberFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredMembersList.map((m) => {
                const isDormant = m.status === 'dormant';
                return (
                  <div
                    key={m.id}
                    className={`border rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                      isDormant
                        ? 'bg-slate-50/80 border-slate-200 opacity-85'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isDormant
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {m.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {m.name}
                          </span>
                          {isDormant ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
                              휴면
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              활동중
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <label className="inline-flex items-center gap-1">
                            <span>기준에버</span>
                            <input
                              type="number"
                              disabled={!isAdmin}
                              value={m.baseAvg}
                              onChange={(e) =>
                                updateMemberField(m.id, 'baseAvg', Number(e.target.value) || 0)
                              }
                              className="w-14 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-center font-bold text-slate-900 tabular-nums"
                            />
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <span>핸디</span>
                            <input
                              type="number"
                              disabled={!isAdmin}
                              value={m.handicap}
                              onChange={(e) =>
                                updateMemberField(m.id, 'handicap', Number(e.target.value) || 0)
                              }
                              className="w-12 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-center font-bold text-slate-900 tabular-nums"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleDormantMember(m.id)}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border whitespace-nowrap ${
                            isDormant
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isDormant ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" /> 활동 복귀
                            </>
                          ) : (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" /> 휴면 전환
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTargetMember(m)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          title="회원 영구 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================
          하단 고정 내비게이션 바 (6개 탭)
         ============================================================ */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-2 py-1.5 grid grid-cols-6 gap-1">
          {[
            { id: 'leaderboard', label: '기록/랭킹', icon: Trophy },
            { id: 'scores', label: '점수입력', icon: Edit3 },
            { id: 'lanes', label: '레인표', icon: LayoutGrid },
            { id: 'teams', label: '팀짜기', icon: Shuffle },
            { id: 'settlement', label: '정산', icon: Calculator },
            { id: 'members', label: '회원관리', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
                  active
                    ? 'text-blue-600 bg-blue-50/80 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============================================================
          모달 1: 새 정기전 회차 생성 모달
         ============================================================ */}
      {isAdmin && showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSession}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-600" /> 새 정기전 회차 추가
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">정기전 날짜</label>
              <input
                type="date"
                required
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">회차 제목</label>
              <input
                type="text"
                required
                placeholder="예: 제43회 정기전"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">게임비(원)</label>
                <input
                  type="number"
                  value={newSessionGameFee}
                  onChange={(e) => setNewSessionGameFee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">사이드비(원)</label>
                <input
                  type="number"
                  value={newSessionSidePot}
                  onChange={(e) => setNewSessionSidePot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs"
              >
                회차 생성
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          모달 2: 신규 회원 / 게스트 등록 모달
         ============================================================ */}
      {isAdmin && showAddMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMember}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" /> 신규 회원 / 게스트 등록
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">이름</label>
              <input
                type="text"
                required
                placeholder="회원 성명 입력"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  기준 에버리지
                </label>
                <input
                  type="number"
                  value={newMemberAvg}
                  onChange={(e) => setNewMemberAvg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">핸디캡</label>
                <input
                  type="number"
                  value={newMemberHandicap}
                  onChange={(e) => setNewMemberHandicap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newMemberIsGuest}
                onChange={(e) => setNewMemberIsGuest(e.target.checked)}
                className="rounded text-blue-600"
              />
              게스트(일일 참가자)로 등록
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs"
              >
                등록 완료
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          모달 3: 레인 빈 슬롯 회원 배정 모달 (에버만 표시)
         ============================================================ */}
      {isAdmin && assignModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                {assignModalTarget.laneNum}레인 · {assignModalTarget.slotIdx + 1}번 자리 배정
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">배정할 활동중 회원을 선택하세요.</p>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {unassignedActiveMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  미배정된 활동중 회원이 없습니다.
                </div>
              ) : (
                unassignedActiveMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      handleAssignMemberToLaneSlot(
                        assignModalTarget.laneNum,
                        assignModalTarget.slotIdx,
                        m.id
                      )
                    }
                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50 text-left transition-colors"
                  >
                    <span className="font-bold text-sm text-slate-900">{m.name}</span>
                    <span className="text-xs font-extrabold text-blue-600 tabular-nums">
                      에버 {m.baseAvg}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 4: 레인표 PNG 이미지 미리보기 및 다운로드 모달
         ============================================================ */}
      {lanePreviewImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                레인 배정표 이미지 미리보기
              </h3>
              <button
                type="button"
                onClick={() => setLanePreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-50 flex justify-center">
              <img
                src={lanePreviewImage}
                alt="레인 배정표"
                className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLanePreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                닫기
              </button>
              <a
                href={lanePreviewImage}
                download={`KOBO_레인배정표_${currentSession?.date || 'lane'}.png`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs"
              >
                <Download className="w-3.5 h-3.5" /> PNG 이미지 저장
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 5: 수동 텍스트 복사 대체 모달
         ============================================================ */}
      {manualTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">{manualTextModal.title}</h3>
              <button
                type="button"
                onClick={() => setManualTextModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              readOnly
              rows={10}
              value={manualTextModal.text}
              onFocus={(e) => e.target.select()}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 outline-none"
            />
            <button
              type="button"
              onClick={() => setManualTextModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 5-1: 회원 휴면 전환 / 영구 삭제 선택 모달
         ============================================================ */}
      {isAdmin && deleteTargetMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  {deleteTargetMember.name} 회원 처리
                </h3>
                <p className="text-[11px] text-slate-500">
                  휴면 전환 또는 영구 삭제를 선택할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                • <strong>휴면 모드 전환</strong>: 과거 정기전 기록은 그대로 유지되고 당일 명단에서만 제외됩니다.
              </p>
              <p className="text-rose-600">
                • <strong>영구 삭제</strong>: 모든 정기전 회차 점수, 레인표, 팀 기록에서 완전히 삭제됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleDormantMember(deleteTargetMember.id);
                  setDeleteTargetMember(null);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs"
              >
                {deleteTargetMember.status === 'dormant'
                  ? '활동중으로 복귀하기'
                  : '휴면 모드로 전환 (기록 보존)'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs"
              >
                영구 삭제하기
              </button>
              <button
                type="button"
                onClick={() => setDeleteTargetMember(null)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 5-2: 선택한 정기전 회차(전 기록) 영구 삭제 확인 모달
         ============================================================ */}
      {isAdmin && deleteTargetSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  {deleteTargetSession.title} 기록 삭제
                </h3>
                <p className="text-[11px] text-slate-500">
                  {deleteTargetSession.date} · 참석 {deleteTargetSession.records.length}명
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed mb-4">
              해당 정기전 회차의 <strong>점수 기록, 레인 배정표, 정산 내역</strong>이 영구 삭제되며 학기 전체 상세 기록에서도 제외됩니다. 삭제 후에는 복구할 수 없습니다.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSession(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs"
              >
                회차 영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 5-3: 보관된 이전 학기 기록 영구 삭제 확인 모달
         ============================================================ */}
      {role === 'admin' && deleteTargetSemester && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  {deleteTargetSemester.name} 기록 삭제
                </h3>
                <p className="text-[11px] text-slate-500">
                  보관일 {deleteTargetSemester.archivedAt} · 총 {deleteTargetSemester.sessions.length}개 정기전 회차
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed mb-4">
              보관된 <strong>{deleteTargetSemester.name}</strong>의 모든 정기전 회차, 누적 상세 기록, 레인표 및 정산 아카이브가 영구 삭제됩니다. 삭제 후에는 복구할 수 없습니다.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSemester(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSemester}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs"
              >
                이전 학기 영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          모달 6: 새 학기 초기화 & 이전 학기 아카이브 저장 모달
         ============================================================ */}
      {isAdmin && showResetSemesterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetSemester}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    새 학기 시작 및 기록 초기화
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    현재 <strong>{currentSemesterName}</strong> 기록은 안전하게 보관됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetSemesterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 text-[11px] text-indigo-950 space-y-1">
              <p className="font-bold">초기화 시 처리 안내</p>
              <p>
                • <strong>{currentSemesterName}</strong>의 모든 정기전 회차({sortedSessions.length}개 회차)와 누적 기록은 상단 학기 선택기에서 언제든 다시 열람할 수 있도록 보관됩니다.
              </p>
              <p>
                • 회원 명단과 활동/휴면 상태는 유지되며, 새 학기 점수 및 누적 기록만 0부터 새로 시작합니다.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                새로 시작할 학기명
              </label>
              <input
                type="text"
                placeholder="예: 2027-1학기"
                value={nextSemesterName}
                onChange={(e) => setNextSemesterName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  첫 정기전 날짜
                </label>
                <input
                  type="date"
                  value={nextFirstDate}
                  onChange={(e) => setNextFirstDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  첫 정기전 회차명
                </label>
                <input
                  type="text"
                  placeholder="예: 제1회 정기전"
                  value={nextFirstTitle}
                  onChange={(e) => setNextFirstTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateBaseAvgFromSemester}
                onChange={(e) => setUpdateBaseAvgFromSemester(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600"
              />
              <span className="text-[11px] text-slate-700 leading-snug">
                <strong>직전 학기 통산 에버리지</strong>를 새 학기 회원의 기준 에버리지(및 핸디캡)로 자동 반영합니다.
              </span>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetSemesterModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm"
              >
                보관 후 새 학기 시작
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          모달 7: 메인 화면 내 운영진 PIN 인증 모달
         ============================================================ */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePinSubmit}
            className="w-full max-w-xs bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-base flex items-center gap-1.5 text-slate-900">
                <Lock className="w-4 h-4 text-blue-600" /> 운영진 인증
              </h3>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              운영진 전용 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[0.5em] font-black py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
            />
            {pinError && <p className="text-xs text-rose-600 mt-2">{pinError}</p>}
            <button
              type="submit"
              className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              확인
            </button>
          </form>
        </div>
      )}

      {/* ============================================================
          모달 8: 임원진 설정 모달 (비밀번호 변경 & 로그아웃 & 데이터 초기화)
         ============================================================ */}
      {showAdminSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-base">임원진 설정 및 보안</h3>
              </div>
              <button
                onClick={() => setShowAdminSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 bg-white">
              {/* 섹션 1: 임원진 비밀번호(PIN) 변경 */}
              <form onSubmit={handleChangeAdminPin} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" /> 임원진 로그인 비밀번호 변경
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDefaultPin}
                    className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> 초기 비밀번호 복원
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="현재 숫자 비밀번호"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        새 비밀번호 (4~8자리 숫자)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="새 비밀번호"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="다시 입력"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {pinChangeError && (
                    <p className="text-[11px] font-semibold text-rose-600">
                      {pinChangeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs"
                  >
                    비밀번호 변경 저장
                  </button>
                </div>
              </form>

              {/* 섹션 2: 임원진 로그아웃 및 권한 전환 */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-rose-600" /> 임원진 로그아웃 및 권한 전환
                </span>

                <button
                  type="button"
                  onClick={handleSwitchToMemberMode}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">
                      회원 모드(읽기 전용)로 전환
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      현재 화면을 유지하면서 편집 잠금 상태로 전환합니다.
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleFullLogout}
                  className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div>
                    <div className="text-xs font-extrabold text-rose-700">
                      완전 로그아웃 (초기 입장 화면으로)
                    </div>
                    <p className="text-[11px] text-rose-600/80 mt-0.5">
                      임원진 세션을 종료하고 첫 시작 화면으로 돌아갑니다.
                    </p>
                  </div>
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                </button>
              </div>

              {/* 섹션 3: 데이터 저장 및 샘플 복원 */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-600" /> 데이터 저장 및 외부 사이트 공유 설정
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {db
                    ? '현재 실시간 클라우드에 연결되어 모든 기기와 데이터가 자동 공유됩니다.'
                    : '현재 독립 웹 모드로 동작 중입니다. 아래에 Firebase 설정 JSON을 입력하면 외부 사이트에서도 다중 기기 실시간 공유가 가능합니다.'}
                </p>

                {typeof __firebase_config === 'undefined' && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      외부 호스팅용 Firebase Config (JSON)
                    </label>
                    <textarea
                      rows={3}
                      value={externalConfigInput}
                      onChange={(e) => setExternalConfigInput(e.target.value)}
                      placeholder='{"apiKey":"...","authDomain":"...","projectId":"..."}'
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white text-[11px] font-mono text-slate-800 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveExternalFirebaseConfig}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                    >
                      외부 클라우드 연결 설정 저장
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px]"
                >
                  초기 샘플 데이터로 되돌리기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}