import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, SchoolSettings } from '../types';

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: SchoolSettings | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType>({
  user: null,
  profile: null,
  settings: null,
  loading: true,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for school settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'school'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SchoolSettings);
      } else {
        setSettings({ schoolName: 'SD Negeri 4 Pusungi', principalName: 'Kepala Sekolah' });
      }
    });

    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      
      // Bersihkan listener profil sebelumnya jika ada
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Gunakan onSnapshot agar sinkronisasi uid di Login.tsx langsung terdeteksi
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // Profile mungkin belum siap (sedang migrasi)
            // Kita tunggu listener mendeteksi create/update
            setProfile(null);
            // Jangan matikan loading jika kita yakin profile harusnya ada
          }
        }, (err) => {
          console.error("Profile snapshot error:", err);
          setLoading(false);
        });

        // Timeout safety: Jika setelah 3 detik profile tidak ditemukan, hentikan loading
        setTimeout(() => setLoading(false), 3000);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubSettings();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, profile, settings, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
