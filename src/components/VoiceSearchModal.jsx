/**
 * VoiceSearchModal
 * ─────────────────────────────────────────────────────────────
 * Audio-recording based voice search modal.
 *
 * Flow:
 *   1. User clicks "Record"  →  MediaRecorder starts, waveform animates only while sound detected.
 *   2. User clicks "Stop"    →  Recording ends, Play / Cancel / Search buttons appear.
 *   3. Play                  →  Plays the recorded blob.
 *   4. Cancel                →  Discards the recording, resets to idle.
 *   5. Search                →  POSTs multipart/form-data { audio } to /extract_route.
 *                               On success  → calls onRouteFound({ source, destination }).
 *                               On error    → shows inline notification.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    Mic, MicOff, Play, Pause, Trash2, Search,
    X, Loader2, AlertCircle, CheckCircle2, Square,
} from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { PYTHON_API_URL } from '../config/apiConfig';

/* ─── constants ─────────────────────────────────────────────── */
const BACKEND_URL = PYTHON_API_URL;
const WAVE_BARS   = 32;   // number of equaliser bars
const SILENCE_THRESHOLD = 6; // RMS value below which we consider silence

/* ─── tiny helpers ───────────────────────────────────────────── */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════ */
export default function VoiceSearchModal({ isOpen, onClose, onRouteFound }) {
    const { t } = useGlobalContext(); // Get translation context
    
    /* ── state ── */
    const [phase, setPhase]           = useState('idle');   // idle | recording | stopped | uploading
    const [audioURL, setAudioURL]     = useState(null);     // blob URL for playback
    const [isPlaying, setIsPlaying]   = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [barHeights, setBarHeights] = useState(Array(WAVE_BARS).fill(4));
    const [isSpeaking, setIsSpeaking] = useState(false);    // true only when RMS > threshold

    /* ── refs ── */
    const mediaRecorderRef = useRef(null);
    const chunksRef        = useRef([]);
    const audioBlobRef     = useRef(null);
    const audioURLRef      = useRef(null);   // mirror of audioURL state — always current, safe inside callbacks
    const audioElemRef     = useRef(null);
    const audioCtxRef      = useRef(null);
    const analyserRef      = useRef(null);
    const sourceNodeRef    = useRef(null);
    const animFrameRef     = useRef(null);
    const streamRef        = useRef(null);

    /* ── reset everything when modal is opened ── */
    useEffect(() => {
        if (isOpen) resetAll();
        else        teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    /* ── cleanup on unmount ── */
    useEffect(() => () => teardown(), []);

    /* ── block body scroll when modal is open ── */
    useEffect(() => {
        if (isOpen) {
            // Save current overflow style and block scrolling
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            
            return () => {
                // Restore original overflow when modal closes
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    /* ─── teardown helpers ──────────────────────────────────── */
    function stopAnimationLoop() {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
    }

    function teardownAudioContext() {
        stopAnimationLoop();
        try { sourceNodeRef.current?.disconnect(); } catch {}
        try { analyserRef.current?.disconnect();   } catch {}
        try { audioCtxRef.current?.close();        } catch {}
        sourceNodeRef.current = null;
        analyserRef.current   = null;
        audioCtxRef.current   = null;
    }

    function stopMediaStream() {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }

    function teardown() {
        stopAnimationLoop();
        teardownAudioContext();
        stopMediaStream();
        // Stop active MediaRecorder without triggering onstop side-effects
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            if (mediaRecorderRef.current.state !== 'inactive') {
                try { mediaRecorderRef.current.stop(); } catch {}
            }
            mediaRecorderRef.current = null;
        }
        // Stop and discard the playback element
        if (audioElemRef.current) {
            audioElemRef.current.pause();
            audioElemRef.current.src = '';
            audioElemRef.current = null;
        }
        // Revoke the blob URL using the ref (always current, never stale)
        if (audioURLRef.current) {
            URL.revokeObjectURL(audioURLRef.current);
            audioURLRef.current = null;
        }
    }

    function resetAll() {
        teardown();
        chunksRef.current    = [];
        audioBlobRef.current = null;
        setAudioURL(null);
        setPhase('idle');
        setIsPlaying(false);
        setError('');
        setSuccess('');
        setBarHeights(Array(WAVE_BARS).fill(4));
        setIsSpeaking(false);
    }

    /* ─── waveform animation ────────────────────────────────── */
    const startWaveform = useCallback((stream) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx      = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source   = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current  = ctx;
        analyserRef.current  = analyser;
        sourceNodeRef.current = source;

        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
            analyser.getByteFrequencyData(dataArr);

            // Compute a simple RMS proxy from first half of the spectrum
            const half = Math.floor(dataArr.length / 2);
            let sumSq  = 0;
            for (let i = 0; i < half; i++) sumSq += dataArr[i] * dataArr[i];
            const rms = Math.sqrt(sumSq / half);

            const speaking = rms > SILENCE_THRESHOLD;
            setIsSpeaking(speaking);

            if (speaking) {
                const heights = Array.from({ length: WAVE_BARS }, (_, i) => {
                    const binIdx = Math.floor((i / WAVE_BARS) * half);
                    const raw    = dataArr[binIdx] || 0;
                    return clamp(Math.round((raw / 255) * 56) + 4, 4, 60);
                });
                setBarHeights(heights);
            } else {
                // collapse bars to flat line when silent
                setBarHeights(Array(WAVE_BARS).fill(4));
            }

            animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
    }, []);

    /* ─── start recording ───────────────────────────────────── */
    const handleRecord = async () => {
        setError('');
        setSuccess('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            streamRef.current = stream;

            // Prefer webm/opus then mp4 then wav
            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
                .find(m => MediaRecorder.isTypeSupported(m)) || '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                stopAnimationLoop();
                teardownAudioContext();
                stopMediaStream();

                // If the modal was already reset/closed before onstop fired,
                // discard this recording entirely — don't pollute the fresh state.
                if (mediaRecorderRef.current === null) return;

                const blob = new Blob(chunksRef.current, {
                    type: mimeType || 'audio/webm',
                });
                audioBlobRef.current = blob;
                const url = URL.createObjectURL(blob);
                audioURLRef.current = url;   // keep ref in sync with state
                setAudioURL(url);
                setBarHeights(Array(WAVE_BARS).fill(4));
                setIsSpeaking(false);
                setPhase('stopped');
            };

            recorder.start(100); // collect in 100ms chunks
            startWaveform(stream);
            setPhase('recording');
        } catch (err) {
            console.error('Microphone error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError(t.voicePermissionDenied);
            } else {
                setError(t.voiceAccessDenied);
            }
        }
    };

    /* ─── stop recording ────────────────────────────────────── */
    const handleStop = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch {}
        }
    };

    /* ─── play / pause recorded audio ──────────────────────── */
    const handlePlay = () => {
        if (!audioURL) return;
        if (!audioElemRef.current) {
            const el = new Audio(audioURL);
            el.onended = () => setIsPlaying(false);
            audioElemRef.current = el;
        }
        if (isPlaying) {
            audioElemRef.current.pause();
            setIsPlaying(false);
        } else {
            audioElemRef.current.currentTime = 0;
            audioElemRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    /* ─── cancel / discard ──────────────────────────────────── */
    const handleCancel = () => {
        if (audioElemRef.current) {
            audioElemRef.current.pause();
            audioElemRef.current = null;
        }
        resetAll();
    };

    /* ─── upload to backend ─────────────────────────────────── */
    const handleSearch = async () => {
        if (!audioBlobRef.current) return;
        setError('');
        setSuccess('');
        setPhase('uploading');

        try {
            const ext = (audioBlobRef.current.type.split('/')[1] || 'webm').split(';')[0];
            const formData = new FormData();
            formData.append('audio', audioBlobRef.current, `recording.${ext}`);

            const res = await fetch(`${BACKEND_URL}/voice-route`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`${t.voiceServerError}: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.prediction?.source && data.prediction?.destination) {
                setSuccess(`${t.voiceDetected}: ${data.prediction.source} → ${data.prediction.destination}`);
                // Give the user a moment to see the success message
                setTimeout(() => {
                    onRouteFound({
                        source:      data.prediction.source,
                        destination: data.prediction.destination,
                    });
                    onClose();
                }, 800);
            } else {
                setError(data.error || t.voiceDetectionFailed);
                setPhase('stopped');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(t.voiceDetectionFailed);
            setPhase('stopped');
        }
    };

    /* ─── keyboard: Escape closes modal ─────────────────────── */
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    /* ─── derived display values ─────────────────────────────── */
    const isRecording = phase === 'recording';
    const isStopped   = phase === 'stopped';
    const isUploading = phase === 'uploading';

    /* ─── render ─────────────────────────────────────────────── */
    return ReactDOM.createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Voice Route Search"
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                padding: '0 16px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 24,
                    width: '100%',
                    maxWidth: 480,
                    fontFamily: 'Poppins, sans-serif',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
                    overflow: 'hidden',
                    animation: 'vmSlideUp 0.28s cubic-bezier(.22,1,.36,1) both',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    padding: '22px 22px 18px',
                    color: '#fff',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 12,
                                background: 'rgba(255,255,255,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Mic size={20} color="#fff" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>
                                    Voice Route Search
                                </p>
                                <p style={{ margin: 0, fontSize: 11, opacity: 0.82 }}>
                                    Record your source &amp; destination
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            style={{
                                background: 'rgba(255,255,255,0.18)', border: 'none',
                                borderRadius: 10, width: 34, height: 34,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={17} color="#fff" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '24px 24px 20px' }}>

                    {/* ── Waveform visualiser ── */}
                    <div style={{
                        height: 80,
                        borderRadius: 16,
                        background: isRecording
                            ? (isSpeaking ? '#fff7ed' : '#f9fafb')
                            : '#f9fafb',
                        border: `2px solid ${isRecording
                            ? (isSpeaking ? '#f97316' : '#e5e7eb')
                            : '#e5e7eb'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        marginBottom: 20,
                        transition: 'border-color 0.25s, background 0.25s',
                        overflow: 'hidden',
                        padding: '0 16px',
                    }}>
                        {isRecording ? (
                            barHeights.map((h, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: 3,
                                        height: h,
                                        borderRadius: 99,
                                        background: isSpeaking
                                            ? `hsl(${24 + (i / WAVE_BARS) * 20}, 90%, ${50 + (h / 60) * 10}%)`
                                            : '#d1d5db',
                                        transition: isSpeaking
                                            ? 'height 0.06s ease-out'
                                            : 'height 0.2s ease-out',
                                        flexShrink: 0,
                                    }}
                                />
                            ))
                        ) : (
                            /* Idle / stopped placeholder */
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                {isStopped ? (
                                    <>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                            Recording ready
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: 11 }}>Play, discard or send</p>
                                    </>
                                ) : isUploading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <Loader2 size={22} style={{ color: '#f97316', animation: 'spin 0.8s linear infinite' }} />
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>Analysing audio…</p>
                                    </div>
                                ) : (
                                    <>
                                        <Mic size={24} style={{ opacity: 0.35, display: 'block', margin: '0 auto 4px' }} />
                                        <p style={{ margin: 0, fontSize: 12 }}>Press <strong>Record</strong> and speak</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Status label under waveform ── */}
                    {isRecording && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 6, marginBottom: 18, marginTop: -10,
                        }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: isSpeaking ? '#f97316' : '#9ca3af',
                                boxShadow: isSpeaking ? '0 0 0 3px rgba(249,115,22,0.25)' : 'none',
                                animation: isSpeaking ? 'vmPulse 1s ease-in-out infinite' : 'none',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: isSpeaking ? '#f97316' : '#9ca3af' }}>
                                {isSpeaking ? 'Detecting speech…' : 'Waiting for speech…'}
                            </span>
                        </div>
                    )}

                    {/* ── Tips + Example (idle only) ── */}
                    {phase === 'idle' && (
                        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>

                            {/* Tips row */}
                            <div style={{
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: 12, padding: '12px 14px',
                            }}>
                                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    💡 Tips
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { icon: '🐢', text: 'Speak slowly and clearly' },
                                        { icon: '🏷️', text: 'Pronounce stops name in English Accent' },
                                        { icon: '📍', text: 'Mention FROM (where you are) and TO (where you\'re going)' },
                                    ].map(({ icon, text }) => (
                                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
                                            <span style={{ fontSize: 12, color: '#78350f', fontWeight: 500 }}>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Example */}
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 12, padding: '12px 14px',
                            }}>
                                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    �️ Example
                                </p>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15803d', fontStyle: 'italic', lineHeight: 1.5 }}>
                                    "I am in Faisal Mosque, I want to go to Aabpara"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Success banner ── */}
                    {success && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>{success}</span>
                        </div>
                    )}

                    {/* ── Error banner ── */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: '#991b1b' }}>{error}</span>
                        </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div style={{ display: 'flex', gap: 10 }}>

                        {/* RECORD / STOP button — always visible */}
                        {!isStopped && !isUploading && (
                            <button
                                onClick={isRecording ? handleStop : handleRecord}
                                style={{
                                    flex: 1,
                                    padding: '13px 10px',
                                    borderRadius: 14,
                                    border: 'none',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    background: isRecording ? '#fef2f2' : '#f97316',
                                    color: isRecording ? '#dc2626' : '#fff',
                                    boxShadow: isRecording
                                        ? '0 4px 14px rgba(220,38,38,0.15)'
                                        : '0 4px 14px rgba(249,115,22,0.3)',
                                    transition: 'all 0.18s',
                                }}
                            >
                                {isRecording ? (
                                    <><Square size={17} fill="#dc2626" /> Stop</>
                                ) : (
                                    <><Mic size={17} /> Record</>
                                )}
                            </button>
                        )}

                        {/* PLAY button — only when stopped */}
                        {isStopped && (
                            <button
                                onClick={handlePlay}
                                title="Play / Pause recorded audio"
                                style={{
                                    flex: 1,
                                    padding: '13px 10px',
                                    borderRadius: 14,
                                    border: '1.5px solid #e5e7eb',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    background: isPlaying ? '#eff6ff' : '#f9fafb',
                                    color: isPlaying ? '#2563eb' : '#374151',
                                    transition: 'all 0.18s',
                                }}
                            >
                                {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>
                        )}

                        {/* CANCEL button — only when stopped */}
                        {isStopped && (
                            <button
                                onClick={handleCancel}
                                title="Discard recording"
                                style={{
                                    padding: '13px 14px',
                                    borderRadius: 14,
                                    border: '1.5px solid #e5e7eb',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    background: '#f9fafb',
                                    color: '#6b7280',
                                    transition: 'all 0.18s',
                                    flexShrink: 0,
                                }}
                            >
                                <Trash2 size={17} />
                            </button>
                        )}

                        {/* SEARCH button — only when stopped */}
                        {isStopped && (
                            <button
                                onClick={handleSearch}
                                title="Send audio to backend"
                                style={{
                                    flex: 1,
                                    padding: '13px 10px',
                                    borderRadius: 14,
                                    border: 'none',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    background: '#f97316',
                                    color: '#fff',
                                    boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                                    transition: 'all 0.18s',
                                }}
                            >
                                <Search size={17} /> Search
                            </button>
                        )}

                        {/* UPLOADING state — single centered spinner row */}
                        {isUploading && (
                            <button
                                disabled
                                style={{
                                    flex: 1,
                                    padding: '13px 10px',
                                    borderRadius: 14,
                                    border: 'none',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    background: '#e5e7eb',
                                    color: '#9ca3af',
                                }}
                            >
                                <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
                                Searching…
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Keyframe styles injected once ── */}
            <style>{`
                @keyframes vmSlideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)      scale(1);    }
                }
                @keyframes vmPulse {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(249,115,22,0.25); }
                    50%      { box-shadow: 0 0 0 6px rgba(249,115,22,0.10); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg);   }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>,
        document.body
    );
}
