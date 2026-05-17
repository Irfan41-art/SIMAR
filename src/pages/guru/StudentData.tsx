import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppContext } from '../../context/AppContext';
import { UserPlus, Edit2, Trash2, Search, X, Loader2, Save, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentData() {
  const { user } = useAppContext();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nis: '',
    class: ''
  });

  const fetchStudents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('teacherId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const handleOpenModal = (student: any = null) => {
    setCurrentStudent(student);
    if (student) {
      setFormData({
        name: student.name,
        nisn: student.nisn,
        nis: student.nis,
        class: student.class
      });
    } else {
      setFormData({
        name: '',
        nisn: '',
        nis: '',
        class: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (currentStudent) {
        await updateDoc(doc(db, 'students', currentStudent.id), formData);
      } else {
        await addDoc(collection(db, 'students'), {
          ...formData,
          teacherId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data murid ini?')) {
      await deleteDoc(doc(db, 'students', id));
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nisn.includes(searchTerm) ||
    s.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight uppercase">Data Murid</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Kelola daftar murid di kelas Anda</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <UserPlus size={18} />
          Tambah Murid
        </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Cari murid (Nama, NIS, atau NISN)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950/40 border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white placeholder:text-slate-700 text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nama Murid</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identitas (NISN/NIS)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Kelas</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="animate-spin inline mr-3 w-5 h-5" /> 
                    <span className="text-[10px] font-black uppercase tracking-widest">Memproses Data...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <div className="text-[10px] font-black uppercase tracking-widest">Data murid tidak ditemukan</div>
                  </td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{student.name}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider">{student.nisn}</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{student.nis}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/10 uppercase tracking-widest">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(student)}
                        className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                        title="Edit data"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Hapus data"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-linear-to-r from-emerald-600 to-teal-600 text-white">
                <div>
                  <h3 className="text-xl font-display font-black tracking-tight uppercase">
                    {currentStudent ? 'Ubah Data' : 'Murid Baru'}
                  </h3>
                  <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-1">Formulir Administratif Siswa</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">NISN</label>
                      <input 
                        type="text" required
                        value={formData.nisn}
                        onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">NIS</label>
                      <input 
                        type="text" required
                        value={formData.nis}
                        onChange={(e) => setFormData({...formData, nis: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Kelas</label>
                    <select
                      required
                      value={formData.class}
                      onChange={(e) => setFormData({...formData, class: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-medium appearance-none"
                    >
                      <option value="">Pilih Kelas</option>
                      {[1, 2, 3, 4, 5, 6].map(c => (
                        <option key={c} value={`Kelas ${c}`}>KELAS {c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-emerald-600 to-teal-600 text-white text-sm font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-all shadow-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {currentStudent ? 'Perbarui Data' : 'Simpan Data Murid'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
