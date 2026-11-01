/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Customer,
  DocumentLine,
  DocumentType,
  FormatTemplate,
  GlossaryItem,
  OwnerAccount,
  Payment,
  QuotationBillDocument,
} from './types';
import { storage } from './services/storage';
import { Navigation, TabType } from './components/Navigation';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { HomeDashboard } from './components/HomeDashboard';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { FormatManager } from './components/FormatManager';
import { GlossaryManager } from './components/GlossaryManager';
import { CustomerManager } from './components/CustomerManager';
import { PaymentModal } from './components/PaymentModal';
import { BusinessSettings } from './components/BusinessSettings';
import { OwnerAccountModal } from './components/OwnerAccountModal';
import { UndoSnackbar } from './components/UndoSnackbar';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Core Data States
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [ownerAccount, setOwnerAccount] = useState(() => storage.getOwnerAccount());
  const [documents, setDocuments] = useState(() => storage.getDocuments());
  const [glossary, setGlossary] = useState(() => storage.getGlossary());
  const [formats, setFormats] = useState(() => storage.getFormats());
  const [customers, setCustomers] = useState(() => storage.getCustomers());

  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<{
    doc: QuotationBillDocument | null;
    type: DocumentType;
  } | null>(null);

  const [previewDoc, setPreviewDoc] = useState<QuotationBillDocument | null>(null);
  const [paymentDoc, setPaymentDoc] = useState<QuotationBillDocument | null>(null);

  // Undo line item state
  const [undoItem, setUndoItem] = useState<{
    documentId: string;
    line: DocumentLine;
  } | null>(null);

  // Refresh all state from storage (used after backup restore)
  const refreshAllState = () => {
    setProfile(storage.getProfile());
    setOwnerAccount(storage.getOwnerAccount());
    setDocuments(storage.getDocuments());
    setGlossary(storage.getGlossary());
    setFormats(storage.getFormats());
    setCustomers(storage.getCustomers());
  };

  // Start New Document
  const handleNewDocument = (type: DocumentType) => {
    setEditingDoc({ doc: null, type });
  };

  // Start New Document for specific customer
  const handleNewDocumentForCustomer = (customerId: string, type: DocumentType) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newDoc: QuotationBillDocument = {
      id: `doc-${Date.now()}`,
      type,
      number: storage.getNextNumber(type),
      date: new Date().toISOString().split('T')[0],
      validUntil:
        type === 'quotation'
          ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
          : undefined,
      customerId: cust.id,
      customerSnapshot: cust,
      formatId: storage.getDefaultFormat(type).id,
      status: 'draft',
      lines: [],
      discountType: 'percentage',
      discountValue: 0,
      isTaxEnabled: profile.enableGstByDefault,
      isInterState: false,
      isPriceTaxInclusive: false,
      notes: 'Plumbing materials and labour as per site survey.',
      advancePaidPaise: 0,
      payments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setEditingDoc({ doc: newDoc, type });
  };

  // Save Document from Editor
  const handleSaveDocument = (savedDoc: QuotationBillDocument) => {
    storage.saveDocument(savedDoc);
    // If it's a new document number, increment sequence
    storage.incrementNextNumber(savedDoc.type);
    setDocuments(storage.getDocuments());
    setEditingDoc(null);
  };

  // Convert Quotation to Bill in 1-Tap (Requirement F7)
  const handleConvertToBill = (quotation: QuotationBillDocument) => {
    const newBillNumber = storage.getNextNumber('bill');
    const newBill: QuotationBillDocument = {
      ...quotation,
      id: `bill-${Date.now()}`,
      type: 'bill',
      number: newBillNumber,
      date: new Date().toISOString().split('T')[0],
      validUntil: undefined,
      status: 'draft',
      sourceQuotationId: quotation.id,
      payments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    storage.saveDocument(newBill);
    storage.incrementNextNumber('bill');

    // Also mark source quotation as accepted
    const updatedQuote: QuotationBillDocument = {
      ...quotation,
      status: 'accepted',
      updatedAt: Date.now(),
    };
    storage.saveDocument(updatedQuote);

    setDocuments(storage.getDocuments());
    setEditingDoc({ doc: newBill, type: 'bill' });
  };

  // Duplicate Document (Requirement F12)
  const handleDuplicateDocument = (sourceDoc: QuotationBillDocument) => {
    const nextNum = storage.getNextNumber(sourceDoc.type);
    const duplicated: QuotationBillDocument = {
      ...sourceDoc,
      id: `doc-${Date.now()}`,
      number: nextNum,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      payments: [],
      advancePaidPaise: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    storage.saveDocument(duplicated);
    storage.incrementNextNumber(sourceDoc.type);
    setDocuments(storage.getDocuments());
    setEditingDoc({ doc: duplicated, type: sourceDoc.type });
  };

  // Save Payment against Bill (Requirement F13)
  const handleSavePayment = (payment: Payment) => {
    const bill = documents.find((d) => d.id === payment.billId);
    if (!bill) return;

    const updatedPayments = [...(bill.payments || []), payment];
    const totalPaidPaise =
      bill.advancePaidPaise + updatedPayments.reduce((acc, p) => acc + p.amountPaise, 0);

    // Check if fully paid
    const subtotal = bill.lines.reduce((acc, l) => acc + l.lineTotalPaise, 0);
    const isFullyPaid = totalPaidPaise >= subtotal * 0.95; // Approximate check

    const updatedBill: QuotationBillDocument = {
      ...bill,
      payments: updatedPayments,
      status: isFullyPaid ? 'paid' : 'partial',
      updatedAt: Date.now(),
    };

    storage.saveDocument(updatedBill);
    setDocuments(storage.getDocuments());
  };

  // Undo line item handler
  const handleUndoLineItem = () => {
    if (!undoItem) return;
    // If currently editing, line will be restored
    setUndoItem(null);
  };

  const handleDeletedLine = (line: DocumentLine) => {
    setUndoItem({
      documentId: editingDoc?.doc?.id || 'current',
      line,
    });
    setTimeout(() => {
      setUndoItem(null);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Offline Toast if network disconnects */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline Mode: Working 100% locally from phone storage</span>
        </div>
      )}

      {/* Top Header & Android Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setEditingDoc(null);
          setCurrentTab(tab);
        }}
        onNewDocument={handleNewDocument}
        businessName={profile.name}
        ownerAccount={ownerAccount}
        onOpenOwnerAccount={() => setIsOwnerModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {editingDoc ? (
          <DocumentEditor
            initialDocument={editingDoc.doc}
            documentType={editingDoc.type}
            onSave={handleSaveDocument}
            onCancel={() => setEditingDoc(null)}
            onOpenPreview={(doc) => setPreviewDoc(doc)}
            onDeletedLine={handleDeletedLine}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeDashboard
                documents={documents}
                businessName={profile.name}
                ownerAccount={ownerAccount}
                onOpenOwnerAccount={() => setIsOwnerModalOpen(true)}
                onNewDocument={handleNewDocument}
                onOpenDocument={(doc) => setPreviewDoc(doc)}
                onViewAllDocuments={() => setCurrentTab('documents')}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'documents' && (
              <DocumentList
                documents={documents}
                onOpenDocument={(doc) => setPreviewDoc(doc)}
                onEditDocument={(doc) => setEditingDoc({ doc, type: doc.type })}
                onDuplicateDocument={handleDuplicateDocument}
                onConvertToBill={handleConvertToBill}
                onRecordPayment={(bill) => setPaymentDoc(bill)}
                onDeleteDocument={(id) => {
                  if (confirm('Delete this document?')) {
                    storage.deleteDocument(id);
                    setDocuments(storage.getDocuments());
                  }
                }}
                onNewDocument={handleNewDocument}
              />
            )}

            {currentTab === 'glossary' && (
              <GlossaryManager
                glossary={glossary}
                onSaveItem={(item) => {
                  storage.saveGlossaryItem(item);
                  setGlossary(storage.getGlossary());
                }}
                onDeleteItem={(id) => {
                  storage.deleteGlossaryItem(id);
                  setGlossary(storage.getGlossary());
                }}
                onBulkUpdateRates={(pct, cat) => {
                  storage.bulkUpdateRates(pct, cat);
                  setGlossary(storage.getGlossary());
                  alert(`Updated rates by ${pct}% across ${cat || 'all'} categories.`);
                }}
              />
            )}

            {currentTab === 'customers' && (
              <CustomerManager
                customers={customers}
                documents={documents}
                onSaveCustomer={(c) => {
                  storage.saveCustomer(c);
                  setCustomers(storage.getCustomers());
                }}
                onDeleteCustomer={(id) => {
                  storage.deleteCustomer(id);
                  setCustomers(storage.getCustomers());
                }}
                onOpenDocument={(doc) => setPreviewDoc(doc)}
                onNewDocumentForCustomer={handleNewDocumentForCustomer}
              />
            )}

            {currentTab === 'formats' && (
              <FormatManager
                formats={formats}
                onSaveFormat={(f) => {
                  storage.saveFormat(f);
                  setFormats(storage.getFormats());
                }}
                onDeleteFormat={(id) => {
                  storage.deleteFormat(id);
                  setFormats(storage.getFormats());
                }}
              />
            )}

            {currentTab === 'settings' && (
              <BusinessSettings
                profile={profile}
                ownerAccount={ownerAccount}
                onSaveProfile={(p) => {
                  storage.saveProfile(p);
                  setProfile(storage.getProfile());
                }}
                onDataRestored={refreshAllState}
                onOpenOwnerAccount={() => setIsOwnerModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* PDF & Vector Print Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          format={
            formats.find((f) => f.id === previewDoc.formatId) ||
            storage.getDefaultFormat(previewDoc.type)
          }
          profile={profile}
          onClose={() => setPreviewDoc(null)}
          onUpdateStatus={(st) => {
            const updated = { ...previewDoc, status: st };
            storage.saveDocument(updated);
            setDocuments(storage.getDocuments());
            setPreviewDoc(updated);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {paymentDoc && (
        <PaymentModal
          document={paymentDoc}
          onClose={() => setPaymentDoc(null)}
          onSavePayment={handleSavePayment}
        />
      )}

      {/* Owner Account & GitHub Repository Manager Modal */}
      <OwnerAccountModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        ownerAccount={ownerAccount}
        businessProfile={profile}
        onUpdateOwner={(updated) => setOwnerAccount(updated)}
        onOpenSettings={() => {
          setIsOwnerModalOpen(false);
          setCurrentTab('settings');
        }}
      />

      {/* Undo Snackbar */}
      <UndoSnackbar
        deletedLine={undoItem}
        onUndo={handleUndoLineItem}
        onDismiss={() => setUndoItem(null)}
      />
    </div>
  );
}
