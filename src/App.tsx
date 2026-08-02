/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreateCapsule } from './components/CreateCapsule';
import { ViewCapsule } from './components/ViewCapsule';
import { VaultHistory } from './components/VaultHistory';
import { AICamouflageModal } from './components/AICamouflageModal';
import { QuickExtractModal } from './components/QuickExtractModal';
import { CapsuleCreatedModal } from './components/CapsuleCreatedModal';
import { PosterCardModal } from './components/PosterCardModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'extract' | 'vault'>('create');
  const [viewingCode, setViewingCode] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<number | null>(null);

  // Modals state
  const [isQuickExtractOpen, setIsQuickExtractOpen] = useState(false);
  const [isAICamouflageOpen, setIsAICamouflageOpen] = useState(false);
  const [customCamouflageFromAI, setCustomCamouflageFromAI] = useState<string>('');

  // Created Capsule Success Modal
  const [createdCapsuleData, setCreatedCapsuleData] = useState<{
    capsuleCode: string;
    camouflageText: string;
    unlockTime: number;
    expireTime?: number;
    hasPassword?: boolean;
    isBurnAfterReading?: boolean;
    creatorName?: string;
  } | null>(null);

  // Poster Share Card Modal
  const [posterModalData, setPosterModalData] = useState<{
    code: string;
    text: string;
    unlockTime: number;
    creator?: string;
  } | null>(null);

  // Sync Server Time
  useEffect(() => {
    fetch('/api/time')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverTime) setServerTime(data.serverTime);
      })
      .catch(() => {
        // Fallback to local system time
      });

    // Check if URL has ?code=XXX or #code
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code') || params.get('c');
    if (codeParam) {
      setViewingCode(codeParam.toUpperCase());
    }
  }, []);

  // Save created capsule to local vault
  const saveToVault = (item: {
    code: string;
    camouflageText: string;
    unlockTime: number;
    expireTime?: number;
    creatorName?: string;
  }) => {
    try {
      const saved = localStorage.getItem('time_secret_vault');
      const list = saved ? JSON.parse(saved) : [];
      const updated = [
        {
          code: item.code,
          camouflageText: item.camouflageText,
          unlockTime: item.unlockTime,
          expireTime: item.expireTime,
          createdAt: Date.now(),
          creatorName: item.creatorName,
        },
        ...list.filter((x: { code: string }) => x.code !== item.code),
      ].slice(0, 50); // Keep last 50
      localStorage.setItem('time_secret_vault', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleCapsuleCreated = (data: {
    capsuleCode: string;
    camouflageText: string;
    unlockTime: number;
    expireTime?: number;
    hasPassword?: boolean;
    isBurnAfterReading?: boolean;
    creatorName?: string;
  }) => {
    saveToVault({
      code: data.capsuleCode,
      camouflageText: data.camouflageText,
      unlockTime: data.unlockTime,
      expireTime: data.expireTime,
      creatorName: data.creatorName,
    });
    setCreatedCapsuleData(data);
  };

  const handleOpenCapsuleFromAnywhere = (code: string) => {
    setViewingCode(code.toUpperCase());
    // Update URL query string without reloading page
    const newUrl = `${window.location.pathname}?code=${code.toUpperCase()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleBackToCreate = () => {
    setViewingCode(null);
    setActiveTab('create');
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-slate-50 to-amber-50/30 text-slate-900 font-sans antialiased pb-12">
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (viewingCode) setViewingCode(null);
        }}
        serverTime={serverTime}
        onQuickExtractClick={() => setIsQuickExtractOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-2 sm:px-4">
        {viewingCode ? (
          <ViewCapsule
            capsuleCode={viewingCode}
            onBackToCreate={handleBackToCreate}
            onOpenPosterCard={(data) => setPosterModalData(data)}
          />
        ) : activeTab === 'create' ? (
          <CreateCapsule
            onCapsuleCreated={handleCapsuleCreated}
            onOpenAICamouflageModal={() => setIsAICamouflageOpen(true)}
            customCamouflageFromAI={customCamouflageFromAI}
          />
        ) : (
          <VaultHistory onOpenCapsule={handleOpenCapsuleFromAnywhere} />
        )}
      </main>

      {/* Modals */}
      <QuickExtractModal
        isOpen={isQuickExtractOpen}
        onClose={() => setIsQuickExtractOpen(false)}
        onOpenCapsule={handleOpenCapsuleFromAnywhere}
      />

      <AICamouflageModal
        isOpen={isAICamouflageOpen}
        onClose={() => setIsAICamouflageOpen(false)}
        onSelectText={(text) => setCustomCamouflageFromAI(text)}
      />

      {createdCapsuleData && (
        <CapsuleCreatedModal
          isOpen={Boolean(createdCapsuleData)}
          onClose={() => setCreatedCapsuleData(null)}
          capsuleCode={createdCapsuleData.capsuleCode}
          camouflageText={createdCapsuleData.camouflageText}
          unlockTime={createdCapsuleData.unlockTime}
          expireTime={createdCapsuleData.expireTime}
          hasPassword={createdCapsuleData.hasPassword}
          isBurnAfterReading={createdCapsuleData.isBurnAfterReading}
          creatorName={createdCapsuleData.creatorName}
          onOpenPosterCard={() => {
            setPosterModalData({
              code: createdCapsuleData.capsuleCode,
              text: createdCapsuleData.camouflageText,
              unlockTime: createdCapsuleData.unlockTime,
              creator: createdCapsuleData.creatorName,
            });
          }}
          onViewCapsule={handleOpenCapsuleFromAnywhere}
        />
      )}

      {posterModalData && (
        <PosterCardModal
          isOpen={Boolean(posterModalData)}
          onClose={() => setPosterModalData(null)}
          camouflageText={posterModalData.text}
          capsuleCode={posterModalData.code}
          unlockTime={posterModalData.unlockTime}
          creatorName={posterModalData.creator}
        />
      )}
    </div>
  );
}
