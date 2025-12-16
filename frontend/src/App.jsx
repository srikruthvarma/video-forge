import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileVideo, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [selectedVariants, setSelectedVariants] = useState(['V1']);
  const [selectedProfiles, setSelectedProfiles] = useState(['P2']);


  const PROFILE_LABELS = {
    'P1': '480p',
    'P2': '720p',
    'P3': '1080p'
  };

 
  const toggleVariant = (v) => {
    setSelectedVariants(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v]);
  };
  const toggleProfile = (p) => {
    setSelectedProfiles(prev => prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]);
  };


  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('http://localhost:3000/status');
        setTasks(res.data);
      } catch (err) { 
        console.error("Polling error:", err); 
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

 
  const handleUpload = async () => {
    if (!file) return;
    if (selectedVariants.length === 0 || selectedProfiles.length === 0) {
      alert("Please select at least one format and one resolution.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('variants', JSON.stringify(selectedVariants));
    formData.append('profiles', JSON.stringify(selectedProfiles));

    try {
      await axios.post('http://localhost:3000/upload', formData);
      setFile(null); 
      setTimeout(() => alert("Jobs Dispatched Successfully!"), 100);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error: File too large (>200MB) or Backend Offline.");
    } finally {
      setUploading(false);
    }
  };

  
  const clearFile = () => {
    setFile(null);
  };

 
  const styles = {
    page: { backgroundColor: '#F1F5F9', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px' },
    header: { display: 'flex', justifyContent: 'center', marginBottom: '40px', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    hero: { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '2px dashed #CBD5E1', marginBottom: '40px' },
    checkboxGroup: { display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', flexWrap: 'wrap' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#F8FAFC', padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', userSelect: 'none', transition: 'all 0.2s' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
    card: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B' }}>
          Video Forge
        </div>
      </div>

      {/* Upload Section */}
      <div style={styles.hero}>
        <Upload size={50} color={file ? "#4F46E5" : "#94A3B8"} />
        <h2 style={{ fontSize: '1.5rem', margin: '10px 0', color: '#334155' }}>
          {file ? "File Selected" : "New Transcoding Job"}
        </h2>
        
        {/* Hidden Input */}
        <input 
            type="file" 
            id="fileInput" 
            onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                }
                e.target.value = null; 
            }} 
            style={{ display: 'none' }} 
            accept=".mp4,.mov,.webm" 
        />
        
        {/* Browse Button (Only shows if NO file is selected) */}
        {!file && (
            <label htmlFor="fileInput" style={{ cursor: 'pointer', color: '#4F46E5', fontWeight: 'bold', textDecoration: 'underline' }}>
                Browse Files
            </label>
        )}

        {/* Selected File Display (Only shows if file IS selected) */}
        {file && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '1.1rem' }}>{file.name}</span>
                <button 
                    onClick={clearFile}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                    title="Remove file"
                >
                    <X size={24} />
                </button>
            </div>
        )}

        {/* --- Selection Matrix --- */}
        <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '600px', margin: '30px auto' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#475569' }}>1. Select Output Formats:</p>
            <div style={styles.checkboxGroup}>
                {['V1', 'V2'].map(v => (
                    <label key={v} style={{...styles.checkboxLabel, borderColor: selectedVariants.includes(v) ? '#4F46E5' : '#E2E8F0', backgroundColor: selectedVariants.includes(v) ? '#EEF2FF' : '#F8FAFC'}}>
                        <input type="checkbox" checked={selectedVariants.includes(v)} onChange={() => toggleVariant(v)} /> 
                        <span style={{fontWeight: '500'}}>{v === 'V1' ? 'V1 (H.264 / MP4)' : 'V2 (VP9 / WebM)'}</span>
                    </label>
                ))}
            </div>

            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#475569' }}>2. Select Resolutions:</p>
            <div style={styles.checkboxGroup}>
                {['P1', 'P2', 'P3'].map(p => (
                    <label key={p} style={{...styles.checkboxLabel, borderColor: selectedProfiles.includes(p) ? '#4F46E5' : '#E2E8F0', backgroundColor: selectedProfiles.includes(p) ? '#EEF2FF' : '#F8FAFC'}}>
                        <input type="checkbox" checked={selectedProfiles.includes(p)} onChange={() => toggleProfile(p)} /> 
                        <span style={{fontWeight: '500'}}>{p} ({PROFILE_LABELS[p]})</span>
                    </label>
                ))}
            </div>
        </div>

        {file && (
          <button onClick={handleUpload} disabled={uploading} style={{ backgroundColor: '#4F46E5', color: 'white', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '1rem' }}>
            {uploading ? 'Dispatching...' : 'Start Processing'}
          </button>
        )}
      </div>

      {/* Task Queue */}
      <h3 style={{ color: '#475569', marginBottom: '20px' }}>Task Queue</h3>
      <div style={styles.grid}>
        {tasks.map((task) => (
            <div key={task.task_id} style={styles.card}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '8px' }}><FileVideo size={24} color="#475569" /></div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#1E293B' }}>{task.original_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                            <span style={{ fontWeight: 'bold', color: '#4F46E5' }}>{task.variant}</span> • {task.resolution}
                        </div>
                    </div>
                </div>
                <div>
                    {task.status === 'QUEUED' && <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>QUEUED</span>}
                    
                    {task.status === 'PROCESSING' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4F46E5', fontWeight: 'bold', fontSize: '0.9rem' }}>
                           <Loader2 className="animate-spin" size={18} /> Processing...
                        </div>
                    )}
                    
                    {task.status === 'COMPLETED' && (
                         <a href={`http://localhost:3000/download/${task.output_path}`} download style={{ textDecoration: 'none' }}>
                            <button style={{ backgroundColor: '#D1FAE5', color: '#047857', border: '1px solid #10B981', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '5px' }}>
                                <CheckCircle size={16} /> Download
                            </button>
                         </a>
                    )}
                    
                    {task.status === 'FAILED' && (
                         <span style={{ color: '#EF4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                             <AlertCircle size={16} /> Failed
                         </span>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}