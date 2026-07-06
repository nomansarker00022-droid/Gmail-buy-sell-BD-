import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  LogOut, 
  Database, 
  Search, 
  Sparkles, 
  Plus, 
  Trash2,
  Info
} from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

interface GoogleSheetsPanelProps {
  listings: any[];
  onBulkImport: (importedListings: any[]) => Promise<{ successCount: number, failedCount: number }>;
  onRefreshListings?: () => void;
}

export const GoogleSheetsPanel: React.FC<GoogleSheetsPanelProps> = ({
  listings,
  onBulkImport,
  onRefreshListings
}) => {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  
  // Sheet reading/import states
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetPreviewData, setSheetPreviewData] = useState<any[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number, failed: number } | null>(null);

  // Sheet creation/export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportFilter, setExportFilter] = useState<'All' | 'Available' | 'Sold' | 'Dispute'>('All');

  // Load token if available in sessionStorage (graceful page refresh support)
  useEffect(() => {
    const savedToken = sessionStorage.getItem('google_sheets_token');
    const savedUser = sessionStorage.getItem('google_sheets_user');
    if (savedToken) {
      setGoogleAccessToken(savedToken);
    }
    if (savedUser) {
      try {
        setGoogleUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved sheets user:', e);
      }
    }
  }, []);

  const handleAuthorize = async () => {
    if (isAuthorizing) return;
    setIsAuthorizing(true);
    setPreviewError(null);
    setExportError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      // Add required scopes
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.setCustomParameters({ prompt: 'select_account' });

      console.log('Requesting Google Sheets OAuth popup...');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Failed to obtain Google OAuth access token.');
      }

      setGoogleAccessToken(token);
      setGoogleUser({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      });

      // Cache token and user details in sessionStorage (cleared on logout)
      sessionStorage.setItem('google_sheets_token', token);
      sessionStorage.setItem('google_sheets_user', JSON.stringify({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      }));
      
      console.log('Google Sheets integration authorized successfully!');
    } catch (err: any) {
      console.error('Google Sheets Authorization failed:', err);
      setPreviewError(`অ্যাথেকাইজেশন ব্যর্থ হয়েছে: ${err.message || String(err)}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDisconnect = () => {
    setGoogleAccessToken(null);
    setGoogleUser(null);
    setSheetPreviewData([]);
    setPreviewError(null);
    setExportedSheetUrl(null);
    sessionStorage.removeItem('google_sheets_token');
    sessionStorage.removeItem('google_sheets_user');
  };

  const extractSpreadsheetId = (input: string): string => {
    // Check if user pasted a full URL
    const urlPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = input.match(urlPattern);
    return match ? match[1] : input.trim();
  };

  const handleFetchSheetData = async () => {
    if (!googleAccessToken) {
      setPreviewError('দয়া করে প্রথমে গুগল শিট অ্যাক্সেস অথোরাইজ করুন।');
      return;
    }

    const cleanSpreadsheetId = extractSpreadsheetId(spreadsheetId);
    if (!cleanSpreadsheetId) {
      setPreviewError('দয়া করে Spreadsheet ID অথবা সম্পুর্ন URL প্রদান করুন।');
      return;
    }

    setIsFetchingSheet(true);
    setPreviewError(null);
    setSheetPreviewData([]);
    setImportResult(null);

    try {
      console.log(`Fetching spreadsheet values for ID: ${cleanSpreadsheetId}, Sheet: ${sheetName}`);
      const range = `${sheetName}!A:I`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanSpreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        throw new Error('আপনার প্রদানকৃত শিটে কোনো ডেটা পাওয়া যায়নি।');
      }

      // Check if first row is a header row (highly probable)
      let startIndex = 0;
      const firstRow = rows[0];
      const isHeader = firstRow.some((cell: string) => 
        cell?.toLowerCase().includes('email') || 
        cell?.toLowerCase().includes('gmail') || 
        cell?.toLowerCase().includes('password') || 
        cell?.toLowerCase().includes('type') || 
        cell?.toLowerCase().includes('price')
      );

      if (isHeader) {
        startIndex = 1;
      }

      const parsedListings: any[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

        const email = String(row[0] || '').trim();
        const password = String(row[1] || '').trim();
        
        // Basic email validation
        if (!email.includes('@')) continue;

        const recoveryEmail = String(row[2] || '').trim();
        const twoFactor = String(row[3] || '').trim();
        const type = String(row[4] || 'Full Fresh New').trim();
        const price = parseFloat(row[5] || '16');
        const description = String(row[6] || '').trim();
        const bkashNumber = String(row[7] || '').trim();
        const nagadNumber = String(row[8] || '').trim();

        parsedListings.push({
          email,
          password,
          recoveryEmail,
          twoFactor,
          type,
          price: isNaN(price) ? 16 : price,
          description,
          bkashNumber,
          nagadNumber
        });
      }

      if (parsedListings.length === 0) {
        throw new Error('শিট থেকে কোনো সঠিক জিমেইল লিস্টিং ডেটা পার্স করা যায়নি। কলাম বিন্যাস ঠিক আছে কিনা চেক করুন।');
      }

      setSheetPreviewData(parsedListings);
    } catch (err: any) {
      console.error('Failed to fetch/parse spreadsheet values:', err);
      setPreviewError(`শিট রিড করতে সমস্যা হয়েছে: ${err.message || String(err)}. নিশ্চিত করুন যে Spreadsheet ID এবং Sheet Name একদম সঠিক এবং ফাইলটির অ্যাক্সেস আপনার জিমেইল অ্যাকাউন্টের রয়েছে।`);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleConfirmImport = async () => {
    if (sheetPreviewData.length === 0) return;

    // MANDATORY explicit user confirmation before executing bulk database changes
    const confirmed = window.confirm(
      `আপনি কি নিশ্চিত যে এই ${sheetPreviewData.length}টি জিমেইল অ্যাকাউন্ট ডেটাবেজে এবং সেলস লিস্টিং এ ইম্পোর্ট করতে চান?`
    );
    if (!confirmed) return;

    setIsImporting(true);
    setPreviewError(null);
    setImportResult(null);

    try {
      console.log(`Executing bulk import of ${sheetPreviewData.length} listings...`);
      const result = await onBulkImport(sheetPreviewData);
      setImportResult({
        success: result.successCount,
        failed: result.failedCount
      });
      setSheetPreviewData([]); // Clear preview on successful bulk migration
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      console.error('Failed to complete bulk import:', err);
      setPreviewError(`বাল্ক ইম্পোর্ট সম্পন্ন করতে ত্রুটি হয়েছে: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportListings = async () => {
    if (!googleAccessToken) {
      setExportError('দয়া করে প্রথমে গুগল শিট অ্যাক্সেস অথোরাইজ করুন।');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportedSheetUrl(null);

    try {
      // Filter listings based on the selected export status
      const filteredListings = listings.filter(l => {
        if (exportFilter === 'All') return true;
        return l.status === exportFilter;
      });

      if (filteredListings.length === 0) {
        throw new Error(`এক্সপোর্ট করার জন্য সিলেক্টেড স্ট্যাটাস (${exportFilter}) এর কোনো লিস্টিং পাওয়া যায়নি।`);
      }

      console.log(`Starting export of ${filteredListings.length} listings to a new Google Sheet...`);

      // 1. Create a new spreadsheet
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `TopMail Sell BD - Listings Export (${new Date().toLocaleDateString('bn-BD')})`
          }
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Spreadsheet creation failed with status: ${createRes.status}`);
      }

      const createdSheet = await createRes.json();
      const spreadsheetId = createdSheet.spreadsheetId;
      const sheetUrl = createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // 2. Prepare listing values
      const headers = [
        "Listing ID", 
        "Gmail Account", 
        "Account Type", 
        "Price (BDT)", 
        "bKash Number", 
        "Nagad Number", 
        "Status", 
        "Description", 
        "Created At"
      ];

      const values = [
        headers,
        ...filteredListings.map(l => [
          l.id || "",
          l.gmailAccount || "",
          l.type || "",
          l.price || 0,
          l.bkashNumber || "",
          l.nagadNumber || "",
          l.status || "",
          l.description || "",
          l.createdAt ? (typeof l.createdAt?.toDate === 'function' ? l.createdAt.toDate().toLocaleString() : new Date(l.createdAt).toLocaleString()) : ""
        ])
      ];

      // 3. Write data to spreadsheet
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:I?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${googleAccessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!updateRes.ok) {
        const errJson = await updateRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Data upload failed with status: ${updateRes.status}`);
      }

      console.log('Google Sheets Export completed successfully!');
      setExportedSheetUrl(sheetUrl);
    } catch (err: any) {
      console.error('Google Sheets Export failed:', err);
      setExportError(`এক্সপোর্ট ব্যর্থ হয়েছে: ${err.message || String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8 text-left">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <FileSpreadsheet size={24} />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            গুগল শিট অটোমেশন ও বাল্ক ম্যানেজমেন্ট
            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-600 text-white rounded-md tracking-wider">Sheets API V4</span>
          </h3>
          <p className="text-xs text-slate-400 font-bold">জিমেইল লিস্টিং বাল্ক ইম্পোর্ট করুন এবং অ্যাকাউন্ট তালিকা গুগল শিটে এক্সপোর্ট করুন</p>
        </div>
      </div>

      {/* Auth Gate and Connection Status */}
      {!googleAccessToken ? (
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Lock size={18} />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="font-black text-slate-800 text-sm">শিট ইন্টিগ্রেশন চালু করুন</h4>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              আপনার গুগল অ্যাকাউন্টের সাথে সংযোগ স্থাপন করে নিরাপদ উপায়ে শিট ডেটা পড়া এবং নতুন স্প্রেডশিট ফাইল তৈরি করার অনুমতি দিন।
            </p>
          </div>

          {/* Official styled Sign in with Google Button */}
          <button 
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="gsi-material-button hover:shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-98"
            style={{ margin: '8px auto', display: 'block' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents text-slate-700 font-bold font-sans text-xs">
                {isAuthorizing ? 'সংযোগ স্থাপন করা হচ্ছে...' : 'Sign in with Google to Connect'}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active status indicator */}
          <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-3xl">
            <div className="flex items-center gap-3">
              {googleUser?.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt={googleUser.displayName || 'Google'} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-emerald-200"
                />
              ) : (
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {googleUser?.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div>
                <span className="text-[10px] text-emerald-700 font-black tracking-widest uppercase flex items-center gap-1">
                  ● কানেক্টেড অ্যাকাউন্ট
                </span>
                <h4 className="font-extrabold text-slate-800 text-xs">{googleUser?.displayName}</h4>
                <p className="text-[10px] text-slate-400 font-bold">{googleUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>

          {/* Tabs for Action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Section 1: Bulk Import Card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 space-y-5">
              <div className="flex items-center gap-3 text-blue-600">
                <Upload size={18} />
                <h4 className="font-extrabold text-slate-800 text-sm">গুগল শিট থেকে বাল্ক ইম্পোর্ট</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                আপনার গুগল শিট ফাইলের লিংক/আইডি ও শিট নাম দিয়ে সরাসরি ডেটাবেজে জিমেইল অ্যাকাউন্টগুলো বাল্ক লিস্টিং হিসেবে আপলোড করুন।
              </p>

              {/* Instructions Panel */}
              <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-4 text-[10.5px] text-slate-600 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 mb-1">
                  <Info size={12} />
                  <span>শিট কলাম ফরমেট নির্দেশনা:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 font-bold">
                  <li><strong>কলাম A:</strong> Gmail Address (আবশ্যক)</li>
                  <li><strong>কলাম B:</strong> Password (আবশ্যক)</li>
                  <li><strong>কলাম C:</strong> Recovery Email</li>
                  <li><strong>কলাম D:</strong> 2FA Key/Secret</li>
                  <li><strong>কলাম E:</strong> Type (যেমন: <code>Full Fresh New</code>)</li>
                  <li><strong>কলাম F:</strong> Price (যেমন: <code>16</code>)</li>
                  <li><strong>কলাম G:</strong> Description (ঐচ্ছিক)</li>
                </ul>
              </div>

              {/* Input fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Spreadsheet ID বা URL
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/your-id-here/edit"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Sheet Name (ট্যাবের নাম)
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Sheet1"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold text-xs"
                  />
                </div>

                <button
                  onClick={handleFetchSheetData}
                  disabled={isFetchingSheet || !spreadsheetId}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isFetchingSheet ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      শিট ডেটা লোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      শিট চেক করুন ও প্রিভিউ দেখুন
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Bulk Export Card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 space-y-5">
              <div className="flex items-center gap-3 text-emerald-600">
                <Download size={18} />
                <h4 className="font-extrabold text-slate-800 text-sm">মার্কেটপ্লেস লিস্টিং এক্সপোর্ট</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                আপনার ডেটাবেজে সংরক্ষিত অ্যাকাউন্ট তালিকা সরাসরি একটি নতুন স্প্রেডশিটে ট্রান্সফার করুন। ব্যাকআপ ও রিপোর্টের জন্য এটি অত্যন্ত সুবিধাজনক।
              </p>

              {/* Settings for export */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    ফিল্টার অনুযায়ী লিস্টিং সিলেক্ট করুন
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['All', 'Available', 'Sold', 'Dispute'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setExportFilter(filter)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          exportFilter === filter
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {filter === 'All' ? 'সকল লিস্টিং' : filter === 'Available' ? 'Available (সচল)' : filter === 'Sold' ? 'Sold (বিক্রীত)' : 'Dispute'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExportListings}
                  disabled={isExporting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      নতুন স্প্রেডশিট তৈরি হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      গুগল শিটে এক্সপোর্ট করুন
                    </>
                  )}
                </button>
              </div>

              {/* Export Success/Error Feedback */}
              {exportedSheetUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3"
                >
                  <div className="flex items-start gap-2.5 text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-extrabold text-[11px] leading-tight">এক্সপোর্ট সফল হয়েছে!</h5>
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">আপনার গুগল ড্রাইভে একটি নতুন স্প্রেডশিট ফাইলে ডেটা সেভ করা হয়েছে।</p>
                    </div>
                  </div>
                  <a
                    href={exportedSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>গুগল শিট ফাইলটি ওপেন করুন</span>
                    <ExternalLink size={12} />
                  </a>
                </motion.div>
              )}

              {exportError && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-semibold leading-relaxed">{exportError}</p>
                </motion.div>
              )}
            </div>

          </div>

          {/* Live Preview & Final Import Step */}
          {sheetPreviewData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-blue-600">
                  <Sparkles size={18} />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">ইম্পোর্ট প্রিভিউ ({sheetPreviewData.length}টি অ্যাকাউন্ট পাওয়া গেছে)</h4>
                    <p className="text-[10px] text-slate-400 font-bold">মার্কেটপ্লেসে আপলোড করার পূর্বে ডেটাগুলো মিলিয়ে নিন</p>
                  </div>
                </div>
                <button
                  onClick={() => setSheetPreviewData([])}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-bold"
                >
                  বাতিল করুন
                </button>
              </div>

              {/* Preview Grid Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 font-black">Gmail Address</th>
                      <th className="px-4 py-3 font-black">Password</th>
                      <th className="px-4 py-3 font-black">Recovery Email</th>
                      <th className="px-4 py-3 font-black">Type</th>
                      <th className="px-4 py-3 font-black">Price (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {sheetPreviewData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 truncate max-w-[150px] font-bold text-slate-800">{row.email}</td>
                        <td className="px-4 py-2.5 font-mono text-[9px] text-slate-500">{row.password}</td>
                        <td className="px-4 py-2.5 truncate max-w-[120px] text-slate-500">{row.recoveryEmail || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600">{row.type}</span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{row.price} BDT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sheetPreviewData.length > 10 && (
                  <div className="p-3 bg-slate-50 text-center text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    এবং আরও {sheetPreviewData.length - 10}টি অ্যাকাউন্ট রয়েছে...
                  </div>
                )}
              </div>

              {/* Action Buttons for importing */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      মার্কেটপ্লেসে আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      ইম্পোর্ট নিশ্চিত করুন ({sheetPreviewData.length}টি জিমেইল)
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Feedback logs */}
          {previewError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-2.5 text-red-800"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold leading-relaxed">{previewError}</p>
            </motion.div>
          )}

          {importResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-3 text-emerald-800"
            >
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <h5 className="font-extrabold text-xs">বাল্ক ইম্পোর্ট সম্পন্ন হয়েছে!</h5>
                <p className="text-[10px] font-bold text-emerald-600 mt-1">
                  সফলভাবে যুক্ত হয়েছে: <strong>{importResult.success}</strong>টি অ্যাকাউন্ট।
                  {importResult.failed > 0 && <span className="text-red-500 pl-1.5">ব্যর্থ হয়েছে: {importResult.failed}টি (সম্ভবত ডুপ্লিকেট অ্যাকাউন্ট)।</span>}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
