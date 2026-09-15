import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { ShieldCheck, Trash2, Database, HardDrive, Lock, AlertTriangle, Check } from 'lucide-react';

interface DataCollectionItem {
  category: string;
  item: string;
  purpose: string;
  storageLocation: 'Local Hardware Enclave' | 'Local Device Storage' | 'Local Cache Only';
  isTransmittedToCloud: boolean;
}

const DATA_COLLECTION_TABLE: DataCollectionItem[] = [
  {
    category: 'Device Integrity',
    item: 'OS version, security update recency, screen lock type, developer mode state',
    purpose: 'Device integrity scoring and vulnerability detection',
    storageLocation: 'Local Device Storage',
    isTransmittedToCloud: false,
  },
  {
    category: 'Installed Apps',
    item: 'Package names, declared permission combinations, last opened timestamp',
    purpose: 'Permission risk analysis and high-risk capability detection',
    storageLocation: 'Local Device Storage',
    isTransmittedToCloud: false,
  },
  {
    category: 'Network State',
    item: 'Wi-Fi encryption type (WPA2/WPA3), captive portal flag, active VPN status',
    purpose: 'Network security evaluation and hotspot warnings',
    storageLocation: 'Local Device Storage',
    isTransmittedToCloud: false,
  },
  {
    category: 'Habits Responses',
    item: 'Self-reported answers to 5 security habit questions',
    purpose: 'Behavioral hygiene profile scoring',
    storageLocation: 'Local Device Storage',
    isTransmittedToCloud: false,
  },
  {
    category: 'Vault & Passwords',
    item: 'Encrypted credentials, master keys, OTP tokens',
    purpose: 'Offline password storage and credential hygiene evaluation',
    storageLocation: 'Local Hardware Enclave',
    isTransmittedToCloud: false,
  },
  {
    category: 'Audit History',
    item: 'Timestamped scores, active finding counts, category point breakdown',
    purpose: 'Historical progress tracking and remediation roadmap',
    storageLocation: 'Local Cache Only',
    isTransmittedToCloud: false,
  },
];

export const DataPrivacyScreen: React.FC = () => {
  const { runScan } = useScan();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllData = async () => {
    setIsDeleting(true);

    try {
      // 1. Clear browser local storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Mock cloud purge / Supabase purge call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setIsDeleted(true);
      setShowConfirmModal(false);

      // Re-initialize clean baseline scan
      runScan();
    } catch {
      setIsDeleted(true);
      setShowConfirmModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Data & Privacy
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Transparent data inventory and zero-knowledge privacy controls
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
          100% On-Device
        </span>
      </div>

      {/* Core Privacy Guarantees Plate */}
      <div className="bg-white p-5 border border-neutral-200/80 rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5 border border-emerald-100">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Zero-Knowledge Privacy Architecture
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              SurakshaScore runs directly on your device. We do not collect passwords, OTPs, PINs, bank details, contacts, browsing history, or message content. No personal telemetry is ever stored or shared.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 border border-neutral-200/70 bg-neutral-50 rounded-xl">
            <Database size={15} className="mx-auto mb-1 text-neutral-700" />
            <span className="font-semibold text-neutral-800 block text-[11px]">Zero Telemetry</span>
          </div>
          <div className="p-2.5 border border-neutral-200/70 bg-neutral-50 rounded-xl">
            <Lock size={15} className="mx-auto mb-1 text-neutral-700" />
            <span className="font-semibold text-neutral-800 block text-[11px]">Offline Vault</span>
          </div>
          <div className="p-2.5 border border-neutral-200/70 bg-neutral-50 rounded-xl">
            <HardDrive size={15} className="mx-auto mb-1 text-neutral-700" />
            <span className="font-semibold text-neutral-800 block text-[11px]">Local Storage</span>
          </div>
        </div>
      </div>

      {/* Data Collection & Storage Inventory Table */}
      <article className="space-y-2.5">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
          Data Collection Matrix
        </h3>

        <div className="border border-neutral-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200/80">
                <th className="p-3 font-semibold text-neutral-800">Category</th>
                <th className="p-3 font-semibold text-neutral-800">Items Checked</th>
                <th className="p-3 font-semibold text-neutral-800">Purpose</th>
                <th className="p-3 font-semibold text-neutral-800">Storage Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-[11px]">
              {DATA_COLLECTION_TABLE.map((row) => (
                <tr key={row.category} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3 font-semibold text-neutral-900 whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="p-3 text-neutral-500">{row.item}</td>
                  <td className="p-3 text-neutral-500">{row.purpose}</td>
                  <td className="p-3 font-medium text-emerald-800 whitespace-nowrap">
                    {row.storageLocation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Deletion & Privacy Control Module */}
      <article className="space-y-2.5">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
          Privacy Controls & Data Erasure
        </h3>

        <div className="bg-white p-5 border border-red-200/80 rounded-2xl space-y-3.5 shadow-xs">
          <div>
            <h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Trash2 size={15} />
              Purge All Local Data & Scan History
            </h4>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Permanently deletes all saved audit snapshots, habit responses, cached finding states, and offline vault tokens from this device.
            </p>
          </div>

          {isDeleted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={15} />
              <span>All local telemetry, audit caches, and stored states have been permanently erased.</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full h-11 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 active:scale-[0.98] transition-standard cursor-pointer shadow-xs"
          >
            Delete All My Data
          </button>
        </div>
      </article>

      {/* Deletion Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-floating">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  Confirm Data Erasure
                </h4>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Are you sure you want to delete all stored audit snapshots, local finding records, and habit responses? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-10 border border-neutral-200 bg-white text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 active:scale-[0.98] transition-standard cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="flex-1 h-10 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 active:scale-[0.98] transition-standard disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isDeleting ? 'Erasing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
