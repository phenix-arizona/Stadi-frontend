// src/hooks/useOfflineDownload.js — Feature 4: Offline Lesson Downloads
import { useState, useEffect, useCallback } from 'react';

const VIDEO_CACHE = 'stadi-videos';
const MANIFEST_CACHE = 'stadi-manifests';

function isSWSupported() {
  return 'serviceWorker' in navigator && 'caches' in window;
}

async function getStorageUsage() {
  if (!navigator.storage?.estimate) return { used: 0, total: 0, pct: 0 };
  const { usage, quota } = await navigator.storage.estimate();
  return {
    usedMB:  Math.round((usage || 0) / 1024 / 1024),
    totalMB: Math.round((quota  || 0) / 1024 / 1024),
    pct:     quota ? Math.round(((usage || 0) / quota) * 100) : 0,
  };
}

export function useOfflineDownload(courseId) {
  const [isDownloaded,      setIsDownloaded]      = useState(false);
  const [downloadProgress,  setDownloadProgress]  = useState(0); // 0-100
  const [isDownloading,     setIsDownloading]     = useState(false);
  const [storageInfo,       setStorageInfo]        = useState({ usedMB: 0, totalMB: 0, pct: 0 });

  // Check if course is already cached
  useEffect(() => {
    if (!courseId || !isSWSupported()) return;
    caches.open(MANIFEST_CACHE).then(cache =>
      cache.match(`/api/courses/${courseId}/offline-manifest`)
    ).then(hit => setIsDownloaded(Boolean(hit))).catch(() => {});

    getStorageUsage().then(setStorageInfo).catch(() => {});
  }, [courseId]);

  const downloadCourse = useCallback(async () => {
    if (!courseId || !isSWSupported() || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(5);

    try {
      // Get auth token for SW to use
      const token = localStorage.getItem('stadi_token');

      // Fetch manifest
      const res = await fetch(`/api/courses/${courseId}/offline-manifest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Could not fetch lesson manifest');

      const manifest = await res.json();
      const lessons  = manifest?.data?.lessons || [];
      setDownloadProgress(15);

      // Cache video files with progress tracking
      const cache    = await caches.open(VIDEO_CACHE);
      const total    = lessons.filter(l => l.videoUrl).length;
      let   done     = 0;

      for (const lesson of lessons) {
        if (!lesson.videoUrl) continue;
        try {
          const vRes = await fetch(lesson.videoUrl);
          if (vRes.ok) await cache.put(lesson.videoUrl, vRes);
        } catch { /* skip individual failures */ }
        done++;
        setDownloadProgress(15 + Math.round((done / total) * 75));
      }

      // Cache manifest itself
      const mCache = await caches.open(MANIFEST_CACHE);
      await mCache.put(`/api/courses/${courseId}/offline-manifest`, new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/json', 'sw-fetched-at': String(Date.now()) },
      }));

      setDownloadProgress(100);
      setIsDownloaded(true);
      const info = await getStorageUsage();
      setStorageInfo(info);
    } catch (err) {
      console.error('[Offline] Download error:', err);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  }, [courseId, isDownloading]);

  const deleteCourse = useCallback(async () => {
    if (!courseId || !isSWSupported()) return;
    try {
      const mCache = await caches.open(MANIFEST_CACHE);
      const entry  = await mCache.match(`/api/courses/${courseId}/offline-manifest`);

      if (entry) {
        const manifest = await entry.json().catch(() => ({ data: { lessons: [] } }));
        const vCache   = await caches.open(VIDEO_CACHE);
        for (const lesson of (manifest?.data?.lessons || [])) {
          if (lesson.videoUrl) await vCache.delete(lesson.videoUrl).catch(() => {});
        }
        await mCache.delete(`/api/courses/${courseId}/offline-manifest`);
      }

      setIsDownloaded(false);
      setDownloadProgress(0);
      const info = await getStorageUsage();
      setStorageInfo(info);
    } catch (err) {
      console.error('[Offline] Delete error:', err);
    }
  }, [courseId]);

  return { isDownloaded, isDownloading, downloadProgress, storageInfo, downloadCourse, deleteCourse };
}

// Hook for individual lesson availability check
export function useLessonOffline(videoUrl) {
  const [isAvailableOffline, setIsAvailableOffline] = useState(false);

  useEffect(() => {
    if (!videoUrl || !isSWSupported()) return;
    caches.open(VIDEO_CACHE)
      .then(cache => cache.match(videoUrl))
      .then(hit  => setIsAvailableOffline(Boolean(hit)))
      .catch(() => {});
  }, [videoUrl]);

  return isAvailableOffline;
}
