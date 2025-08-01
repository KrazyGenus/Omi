import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { serviceAccount } from '../../../backend/src/core/firestore/connection';
import { getDatabase, ref, onValue, off } from "firebase/database";

// Helper function to format seconds into MM:SS
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// CSS-based Loading Spinner component
const LoadingSpinner = ({ size = 50 }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    border: `${size / 8}px solid #f3f3f3`, // Light grey border
    borderTop: `${size / 8}px solid #3498db`, // Blue border for the top
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  // Define the keyframes for the spin animation using a style tag
  const keyframesStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={spinnerStyle}></div>
    </>
  );
};

// Component for the main application header
const AppHeader = ({ onLogout }) => {
  return (
    <header className="w-full bg-white shadow-md py-3 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
        Blip
      </div>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm sm:text-base font-medium
                   hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75
                   flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </header>
  );
};

// Component for the large upload section at the top
const UploadSection = ({ onUploadClick, isUploading, uploadedFileName }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click(); // Trigger click on hidden file input
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file.name);
      // Pass the actual File object to the parent component
      onUploadClick(file);
    }
    // Reset file input value to allow selecting the same file again
    event.target.value = null;
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-600 to-purple-700 p-6 md:p-10 lg:p-16 rounded-b-3xl shadow-xl flex flex-col items-center justify-center text-white text-center min-h-[180px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px]">
      <div className="absolute inset-0 bg-pattern opacity-10"></div> {/* Subtle background pattern */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-4 drop-shadow-lg leading-tight">
        Comply with Confidence
      </h1>
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-2xl font-light opacity-90">
        Blip screens your videos for potential violations, keeping your channel safe and thriving.
      </p>
      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="relative px-6 py-3 md:px-8 md:py-4 bg-white text-blue-700 font-bold text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3"
      >
        {isUploading ? (
          <>
            <LoadingSpinner size={20} /> Uploading...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload New Video
          </>
        )}
      </button>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
      {uploadedFileName && isUploading && (
        <p className="mt-3 text-white text-sm md:text-base">
          Uploading: <span className="font-semibold">{uploadedFileName}</span>
        </p>
      )}
    </div>
  );
};
//  ------ END OF THE UPLOAD COMPONENT -----------------------



// Component for a single video card in the list
const VideoCard = ({ video, onSelectVideo }) => {
  const isProcessing = video.status === 'Processing';

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
        ${isProcessing ? 'opacity-80' : ''}`}
      onClick={() => onSelectVideo(video)}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-36 sm:h-40 object-cover rounded-t-xl"
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/320x180/cccccc/333333?text=No+Thumb'; }}
      />
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 truncate">{video.title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-2">Uploaded: {video.uploadDate}</p>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
          <span>Duration: {video.duration}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isProcessing ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {video.status}
          </span>
        </div>
      </div>
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
          <LoadingSpinner size={50} />
        </div>
      )}
    </div>
  );
};

// Component for the list of videos
const VideoList = ({ videos, onSelectVideo }) => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-5 md:mb-6">Your Uploaded Content</h2>
      {videos.length === 0 ? (
        <p className="text-center text-gray-600 text-base sm:text-lg py-10">No videos uploaded yet. Start by uploading one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelectVideo={onSelectVideo} />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for displaying video details and player
/**
 * 
 * @param {*} video := contains the video object with its properties
 * @param {*} onBackList
 */
const VideoDetail = ({ video, onBackToList }) => {
  if (!video) {
    return (
      <div className="p-8 text-center text-gray-600">
        No video selected.
        <button
          onClick={onBackToList}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  // performed a slice using the : as a delimeter, to seperate the userId from the uuid for the video
  // as the userid is used in firebase as a mechanism for segregation and user information isolation
  const analysis = video.analysis;
  const hasAnalysisResults = analysis && (
    (analysis.frameAnalysis && analysis.frameAnalysis.length > 0) ||
    (analysis.audioAnalysisCopyright && analysis.audioAnalysisCopyright.detected) ||
    (analysis.audioAnalysisSpeech && analysis.audioAnalysisSpeech.issues && analysis.audioAnalysisSpeech.issues.length > 0)
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
      <button
        onClick={onBackToList}
        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4 md:mb-6 text-base md:text-lg font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to All Videos
      </button>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden p-5 sm:p-6 md:p-8 lg:p-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">{video.title}</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-5">Uploaded on {video.uploadDate} | Duration: {video.duration}</p>

        {/* Compacted card for "Video processed and analysis complete" */}
        <div className="relative w-full rounded-lg overflow-hidden mb-6 bg-gray-200 flex flex-col items-center justify-center text-gray-700 text-md p-4 h-32 sm:h-40">
          {video.status === 'Ready' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-14 sm:w-14 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11955 0 0112 2.944a11.955 11955 0 01-8.618 3.04A12.001 12001 0 003 12c0 2.757 1.125 5.228 2.938 7.045M19.938 19.045A12.001 12001 0 0021 12c0-2.757-1.125-5.228-2.938-7.045m-7.062 0h.01M12 12v.01" />
              </svg>
              <p className="font-semibold text-sm sm:text-base">Video processed and analysis complete.</p>
              <p className="text-xs sm:text-sm text-gray-500">This video is not stored on the server for playback.</p>
            </>
          ) : (
            <>
              <LoadingSpinner size={60} />
              <p className="mt-3 text-sm sm:text-base">Video is {video.status.toLowerCase()}...</p>
              <p className="text-xs sm:text-sm text-gray-500">Analysis will be available once processing is complete.</p>
            </>
          )}
        </div>

        {video.status === 'Ready' && hasAnalysisResults && analysis ? (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">Analysis Results</h3>

            {/* Frame Analysis Section */}
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Frame Analysis: In-Video Violations
              </h4>
              {analysis.frameAnalysis && analysis.frameAnalysis.length > 0 ? (
                <ul className="list-disc pl-5 space-y-3 text-gray-700">
                  {analysis.frameAnalysis.map((violation, index) => (
                    <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      {violation.frameImage && (
                        <img
                          src={violation.frameImage}
                          alt={`${violation.type} frame`}
                          className="w-32 h-auto sm:w-40 rounded-md shadow-sm flex-shrink-0"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/160x90/cccccc/333333?text=Frame'; }}
                        />
                      )}
                      <div className="text-sm sm:text-base">
                        <span className="font-medium text-red-700">{violation.type}</span> (Severity: {violation.severity}) at{' '}
                        <span className="font-medium">{formatTime(violation.timestamp)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700 font-medium text-sm sm:text-base">No visual violations detected.</p>
              )}
            </div>

            {/* Audio Analysis: Copyright Music */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Audio Analysis: Copyright Music
              </h4>
              {analysis.audioAnalysisCopyright.detected ? (
                <p className="text-red-700 font-medium text-sm sm:text-base">
                  <span className="font-bold">Detected:</span> {analysis.audioAnalysisCopyright.details} (Severity: {analysis.audioAnalysisCopyright.severity})
                </p>
              ) : (
                <p className="text-green-700 font-medium text-sm sm:text-base">No copyrighted music detected.</p>
              )}
            </div>

            {/* Audio Analysis: Speech Compliance */}
            <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Audio Analysis: Speech Compliance
              </h4>
              {analysis.audioAnalysisSpeech.detected && analysis.audioAnalysisSpeech.issues.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {analysis.audioAnalysisSpeech.issues.map((issue, index) => (
                    <li key={index} className="text-sm sm:text-base">
                      <span className="font-medium text-red-700">{issue.type}:</span> "{issue.text}" at{' '}
                      <span className="font-medium">{formatTime(issue.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700 font-medium text-sm sm:text-base">No non-compliant speech (hate speech, bullying) detected.</p>
              )}
            </div>

          </div>
        ) : video.status === 'Ready' && !hasAnalysisResults ? (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">Analysis Results</h3>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm text-blue-800 text-sm sm:text-base">
              <p>No analysis results available for this video yet, or no issues were found.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Main App Component, now renamed to DashboardPage
const DashboardPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  // Initialize videos state as an empty array, removing mock data
  const [videos, setVideos] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [jobId, setJobId] = useState(null);
  const { login } = useAuth(); 

  // Placeholder for logout functionality
  const handleLogout = () => {
    alert('Logout functionality would be implemented here.');
    // In a real app, you'd clear authentication tokens, redirect to login, etc.
  };

  // Modified handleUploadClick to simulate an API request
  const handleUploadClick = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    if (isUploading) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    try {
      const authToken = localStorage.getItem('token');
      const uploadResponse = await axios.post('/api/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('upload successfull', uploadResponse);
      setJobId(uploadResponse.data.jobId);
    } catch (error) {
      console.error('Error occured during upload', error);
      if (error.status === 401) {
        const refreshTokenResponse = await axios.post('/api/user/auth/refresh');
        console.log('My delilay answered me', refreshTokenResponse);
        login(refreshTokenResponse.data.token);
      }
    }

    try {
      // Simulate network delay for the "upload"
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating initial upload time

      // Once "upload" is successful, add the video to the list as 'Processing'
      const newVideo = {
        id: `${jobId}`, // Unique ID for the new video
        title: file.name,
        thumbnail: `https://placehold.co/320x180/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=New+Video`,
        description: 'This video is currently being processed for compliance analysis.',
        uploadDate: new Date().toISOString().slice(0, 10),
        duration: '00:00', // Will be updated after processing
        status: 'Processing',
        analysis: null // Analysis not yet available
      };
      setVideos((prevVideos) => [newVideo, ...prevVideos]);
      setUploadedFileName(''); // Clear file name display

    } catch (error) {
      console.error('Error during upload simulation:', error);
      alert(`Upload failed: ${error.message}. Please try again.`); // Provide user feedback
      setUploadedFileName(''); // Clear file name on error
    } finally {
      setIsUploading(false); // Ensure loading state is reset
    }
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
  };

  const handleBackToList = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter antialiased">
      <AppHeader onLogout={handleLogout} />
      {selectedVideo ? (
        <VideoDetail video={selectedVideo} onBackToList={handleBackToList} />
      ) : (
        <>
          <UploadSection onUploadClick={handleUploadClick} isUploading={isUploading} uploadedFileName={uploadedFileName} />
          <VideoList videos={videos} onSelectVideo={handleSelectVideo} />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
