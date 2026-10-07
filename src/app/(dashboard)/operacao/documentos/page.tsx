'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { DocumentCategory } from '@/types';
import { formatDate } from '@/lib/utils';

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocumentCategory>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('original');

  const documents = databaseStore.getDocuments().filter((d) => {
    const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
    if (!matchesCat) return false;
    if (!searchTerm) return true;
    return d.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createDocument({
      tenantId: tenant.id,
      name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
      category,
      fileUrl: `/uploads/${docName.toLowerCase().replace(/\s+/g, '_')}`,
      fileSize: 1024 * 1024 * 1.8,
      fileType: 'application/pdf',
      uploaderUserId: 'user-mariana',
      uploaderName: 'Mariana Costa',
    });

    setIsUploadModalOpen(false);
    setDocName('');
    setRefresh((r) => r + 1);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir permanentemente o documento "${name}"?`)) {
      databaseStore.deleteDocument(id);
      setRefresh((r) => r + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Repositório de Documentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerenciamento centralizado de documentos originais, minutas, revisões e certidões finais.
          </p>
        </div>

        <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2 shadow-xs text-xs sm:text-sm self-start sm:self-auto">
          <Upload className="w-4 h-4" /> Novo Arquivo
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome de arquivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({databaseStore.getDocuments().length})
          </button>
          <button
            onClick={() => setCategoryFilter('original')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'original'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Originais
          </button>
          <button
            onClick={() => setCategoryFilter('traducao')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'traducao'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Traduções
          </button>
          <button
            onClick={() => setCategoryFilter('comprovante')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'comprovante'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Comprovantes
          </button>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[800px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Nome do Arquivo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tamanho</th>
              <th className="px-4 py-3">Versão</th>
              <th className="px-4 py-3">Enviado por</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-sm">{doc.name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                    {doc.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                </td>
                <td className="px-4 py-3.5 text-xs font-mono">v{doc.version}</td>
                <td className="px-4 py-3.5 text-xs text-slate-700">{doc.uploaderName}</td>
                <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(doc.createdAt)}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={doc.fileUrl}
                      download
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal Upload */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Enviar Documento"
        description="Faça upload de novos documentos para o arquivo seguro."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Arquivo *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ex: Certidao_Casamento_Roberto.pdf"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="original">Original</option>
              <option value="trabalho">Trabalho</option>
              <option value="traducao">Tradução</option>
              <option value="revisao">Revisão</option>
              <option value="final">Final Certificado</option>
              <option value="comprovante">Comprovante</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Documento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
