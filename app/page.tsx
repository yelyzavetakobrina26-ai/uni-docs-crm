'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Filter,
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  doc_number?: string;
  category: string;
  department?: string;
  status: string;
  approved_date?: string;
  drive_url: string;
  drive_file_id?: string;
  created_at?: string;
}

const CATEGORIES = [
  'Загальні політики',
  'Вступна кампанія',
  'Виховні процеси',
  'Операційні питання',
  'Студентське самоврядування',
  'Положення',
  'Наказ',
  'Інше',
];

const STATUSES = [
  'Затверджений',
  'В розробці',
  'Потребує редагування',
  'Чинний',
  'Проєкт',
  'Архівний',
];

export default function UniDocsCRM() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Усі');
  const [statusFilter, setStatusFilter] = useState('Усі');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    doc_number: '',
    category: 'Загальні політики',
    department: '',
    status: 'Затверджений',
    approved_date: '',
    drive_url: '',
  });

  const extractDriveFileId = (url: string): string => {
    if (!url) return '';
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/document\/d\/([a-zA-Z0-9_-]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return '';
  };

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Помилка завантаження документів:', error.message);
    } else {
      setDocuments((data as DocumentItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fileId = extractDriveFileId(formData.drive_url);

    const { error } = await supabase.from('documents').insert([
      {
        title: formData.title,
        doc_number: formData.doc_number || null,
        category: formData.category,
        department: formData.department || null,
        status: formData.status,
        approved_date: formData.approved_date || null,
        drive_url: formData.drive_url,
        drive_file_id: fileId,
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert('Помилка при збереженні: ' + error.message);
      return;
    }

    setFormData({
      title: '',
      doc_number: '',
      category: 'Загальні політики',
      department: '',
      status: 'Затверджений',
      approved_date: '',
      drive_url: '',
    });
    setIsAddModalOpen(false);
    fetchDocuments();
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Видалити цей документ із реєстру?')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doc_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'Усі' || doc.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'Усі' || doc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Затверджений' || status === 'Чинний') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (status === 'Потребує редагування') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    if (status === 'В розробці' || status === 'Проєкт') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Archive className="w-3.5 h-3.5" /> {status || 'Без статусу'}
      </span>
    );
  };

  const uniqueCategories = Array.from(
    new Set([...CATEGORIES, ...documents.map((d) => d.category).filter(Boolean)])
  );
  const uniqueStatuses = Array.from(
    new Set([...STATUSES, ...documents.map((d) => d.status).filter(Boolean)])
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                UniDocs CRM
              </h1>
              <p className="text-xs text-slate-500">
                Реєстр внутрішніх політик та нормативних документів
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Додати документ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Усього документів</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {documents.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Затверджені / Чинні</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {
                documents.filter(
                  (d) => d.status === 'Затверджений' || d.status === 'Чинний'
                ).length
              }
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">В розробці / На редагуванні</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {
                documents.filter(
                  (d) =>
                    d.status === 'В розробці' ||
                    d.status === 'Потребує редагування' ||
                    d.status === 'Проєкт'
                ).length
              }
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук за назвою, номером або підрозділом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Усі">Усі розділи</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Усі">Усі статуси</option>
              {uniqueStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Завантаження реєстру документів...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Документів не знайдено</p>
              <p className="text-slate-400 text-sm mt-1">
                Натисніть «Додати документ» або завантажте CSV у Supabase.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Назва документа</th>
                    <th className="py-3.5 px-4">Розділ</th>
                    <th className="py-3.5 px-4">Статус</th>
                    <th className="py-3.5 px-4 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredDocs.map((doc) => {
                    const resolvedFileId =
                      doc.drive_file_id || extractDriveFileId(doc.drive_url);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-lg">
                          <div>{doc.title}</div>
                          {(doc.doc_number || doc.approved_date) && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {[doc.doc_number, doc.approved_date]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {doc.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-2">
                            {resolvedFileId && (
                              <button
                                onClick={() =>
                                  setPreviewDoc({
                                    ...doc,
                                    drive_file_id: resolvedFileId,
                                  })
                                }
                                title="Переглянути в системі"
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <a
                              href={doc.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Відкрити на Google Диску"
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Видалити"
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Новий документ
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Назва документа *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Напр.: Положення про академічну мобільність"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Розділ
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Статус
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Посилання на файл у Google Диску *
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://docs.google.com/document/d/..."
                  value={formData.drive_url}
                  onChange={(e) =>
                    setFormData({ ...formData, drive_url: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Збереження...' : 'Зберегти документ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewDoc.category} • {previewDoc.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" /> Відкрити в новій вкладці
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={`https://drive.google.com/file/d/${previewDoc.drive_file_id}/preview`}
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
