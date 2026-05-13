// src/components/course/SubmissionCard.jsx — Feature 5: Assignments + Portfolio
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle, Clock, XCircle, Send, FileText, Image, Video } from 'lucide-react';
import { assignmentsAPI } from '../../lib/api';
import useAppStore from '../../store/app.store';

const TYPE_ICONS = { text: FileText, photo: Image, video: Video };
const STATUS_CONFIG = {
  pending:  { label: 'Under review',  color: 'text-amber-600 bg-amber-50',  icon: Clock },
  approved: { label: 'Approved ✅',   color: 'text-green-600 bg-green-50',  icon: CheckCircle },
  rejected: { label: 'Needs revision',color: 'text-red-600 bg-red-50',      icon: XCircle },
};

export default function SubmissionCard({ assignment, courseId }) {
  const { addToast } = useAppStore();
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const [textContent, setTextContent] = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [fileUrl,     setFileUrl]     = useState(null);

  const TypeIcon = TYPE_ICONS[assignment.type] || FileText;

  const existing = assignment.my_submission;
  const status   = existing ? STATUS_CONFIG[existing.status] : null;
  const StatusIcon = status?.icon;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data) => assignmentsAPI.submit(assignment.id, data),
    onSuccess: () => {
      addToast('Submission sent! Your instructor will review it soon.', 'success');
      qc.invalidateQueries({ queryKey: ['assignments', courseId] });
      setTextContent('');
      setFileUrl(null);
      setFilePreview(null);
    },
    onError: (err) => addToast(err?.message || 'Could not submit. Please try again.', 'error'),
  });

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload via instructor upload signature endpoint
      const { data: sigData } = await import('../../lib/api').then(m => m.instructorAPI.uploadSig({
        folder: 'submissions', resourceType: file.type.startsWith('video') ? 'video' : 'image',
      }));
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key',   sigData.apiKey);
      fd.append('timestamp', sigData.timestamp);
      fd.append('signature', sigData.signature);
      fd.append('folder',    sigData.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`, {
        method: 'POST', body: fd,
      });
      const json = await res.json();
      setFileUrl(json.secure_url);
      setFilePreview(file.type.startsWith('image') ? URL.createObjectURL(file) : null);
      addToast('File uploaded successfully', 'success');
    } catch {
      addToast('File upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (assignment.type === 'text' && !textContent.trim()) return;
    if (assignment.type !== 'text' && !fileUrl) return;
    submit({ content: textContent || undefined, fileUrl: fileUrl || undefined });
  }

  return (
    <div className="border border-stadi-green/20 rounded-2xl p-4 bg-stadi-green-light/30 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TypeIcon size={16} className="text-stadi-green" />
        <h4 className="font-semibold text-stadi-dark text-sm">{assignment.title}</h4>
      </div>
      <p className="text-xs text-stadi-gray mb-4 leading-relaxed">{assignment.instructions}</p>

      {/* Existing submission status */}
      {existing && status && (
        <div className={`rounded-xl p-3 mb-3 ${status.color}`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon size={14} />
            <span className="text-xs font-semibold">{status.label}</span>
          </div>
          {existing.feedback && (
            <p className="text-xs mt-1 leading-relaxed">
              <span className="font-medium">Instructor feedback: </span>{existing.feedback}
            </p>
          )}
          {existing.content && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">Your submission: {existing.content}</p>
          )}
        </div>
      )}

      {/* Input area — always show so learner can resubmit */}
      {assignment.type === 'text' ? (
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stadi-green/30 bg-white"
          rows={4}
          placeholder="Type your answer here…"
          value={textContent}
          onChange={e => setTextContent(e.target.value)}
          maxLength={2000}
        />
      ) : (
        <div>
          <input type="file" ref={fileRef} className="hidden"
            accept={assignment.type === 'photo' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
          />
          {filePreview && (
            <img src={filePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl mb-2" />
          )}
          {fileUrl && !filePreview && (
            <div className="bg-green-50 text-green-700 text-xs rounded-xl p-2 mb-2 flex items-center gap-2">
              <CheckCircle size={12} /> File ready to submit
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-stadi-green/30 rounded-xl p-4 text-sm text-stadi-gray hover:border-stadi-green/60 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {uploading ? 'Uploading…' : `Upload ${assignment.type === 'photo' ? 'photo' : 'video'}`}
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || uploading || (assignment.type === 'text' ? !textContent.trim() : !fileUrl)}
        className="mt-3 w-full bg-stadi-green text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
      >
        <Send size={14} />
        {isPending ? 'Submitting…' : existing ? 'Resubmit' : 'Submit Assignment'}
      </button>
    </div>
  );
}
