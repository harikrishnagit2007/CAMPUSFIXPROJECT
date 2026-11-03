import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';

export const CameraCaptureModal = ({ isOpen, onClose, onCapture, showToast }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode) => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API is not supported in your browser.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check camera permissions or use photo upload.');
      if (showToast) {
        showToast('Camera access denied or unavailable.', 'error');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (blob) {
          const file = new File([blob], `maintenance-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        } else {
          if (showToast) showToast('Failed to capture photo from camera.', 'error');
        }
      },
      'image/jpeg',
      0.90
    );
  };

  const toggleCameraFacing = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          maxWidth: '560px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700 }}>
            <Camera size={20} color="#6366f1" />
            <span>Capture Maintenance Issue Photo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Preview */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '360px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {cameraError ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#fca5a5', fontSize: '0.9rem' }}>
              <p>{cameraError}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Footer Controls */}
        <div
          style={{
            padding: '20px',
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #334155',
          }}
        >
          <button
            type="button"
            onClick={toggleCameraFacing}
            style={{
              background: '#334155',
              border: 'none',
              color: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} />
            <span>Flip Camera</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                color: '#cbd5e1',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={Boolean(cameraError) || isCapturing}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                border: 'none',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: Boolean(cameraError) || isCapturing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              {isCapturing ? 'Capturing...' : 'Capture & Analyze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
