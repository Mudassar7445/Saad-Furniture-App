'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Star,
  Trash2,
  Plus,
  RefreshCw,
  HardDrive,
  Eye,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const PRODUCT_CATEGORIES = [
  'Sofas',
  'Double Beds',
  'Single Beds',
  'Wardrobes',
  'Center Tables',
  'Mattresses',
  'Room Chairs',
  'Custom Furniture',
] as const;

interface ProductMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProduct?: any | null;
}

export const ProductMediaUploadModal: React.FC<ProductMediaUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingProduct,
}) => {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>('Sofas');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [status, setStatus] = useState('available');
  const [showroomLocation, setShowroomLocation] = useState('Main Gallery Floor');
  const [warrantyDetails, setWarrantyDetails] = useState('5 Years Architectural Hardwood Warranty');
  const [featured, setFeatured] = useState(false);

  // Media states
  const [images, setImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [videos, setVideos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Populate if editing
  useEffect(() => {
    if (existingProduct) {
      setTitle(existingProduct.title || '');
      setSku(existingProduct.sku || '');
      setCategory(existingProduct.category || 'Sofas');
      setDescription(existingProduct.description || '');
      setPrice(String(existingProduct.price || ''));
      setDiscountPrice(existingProduct.discountPrice ? String(existingProduct.discountPrice) : '');
      setMaterial(existingProduct.material || '');
      setDimensions(existingProduct.dimensions || '');
      setStockQuantity(String(existingProduct.stockQuantity || 1));
      setStatus(existingProduct.status || 'available');
      setShowroomLocation(existingProduct.showroomLocation || 'Main Gallery Floor');
      setWarrantyDetails(existingProduct.warrantyDetails || '5 Years Architectural Hardwood Warranty');
      setFeatured(Boolean(existingProduct.featured));

      try {
        const parsedImgs = typeof existingProduct.images === 'string' ? JSON.parse(existingProduct.images) : existingProduct.images;
        setImages(Array.isArray(parsedImgs) ? parsedImgs : []);
        setFeaturedImage(existingProduct.featuredImage || (Array.isArray(parsedImgs) ? parsedImgs[0] : ''));
      } catch {
        setImages([]);
      }

      try {
        const parsedVids = typeof existingProduct.videos === 'string' ? JSON.parse(existingProduct.videos) : existingProduct.videos;
        setVideos(Array.isArray(parsedVids) ? parsedVids : []);
      } catch {
        setVideos([]);
      }

      try {
        const parsedDocs = typeof existingProduct.documents === 'string' ? JSON.parse(existingProduct.documents) : existingProduct.documents;
        setDocuments(Array.isArray(parsedDocs) ? parsedDocs : []);
      } catch {
        setDocuments([]);
      }
    } else {
      // Reset
      setTitle('');
      setSku('');
      setCategory('Sofas');
      setDescription('');
      setPrice('');
      setDiscountPrice('');
      setMaterial('Solid Hardwood & Premium Finishing');
      setDimensions('');
      setStockQuantity('1');
      setStatus('available');
      setShowroomLocation('Main Gallery Floor');
      setWarrantyDetails('5 Years Architectural Hardwood Warranty');
      setFeatured(false);
      setImages([]);
      setFeaturedImage('');
      setVideos([]);
      setDocuments([]);
    }
  }, [existingProduct, isOpen]);

  // Handle direct file upload to Google Drive 5TB storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setErrorMsg(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${file.name} directly to Google Drive 5TB Storage...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('title', `${title || 'Catalogue'} - ${file.name}`);

        const res = await fetch('/api/admin/google-drive/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.media) {
          const uploadedUrl = data.media.url || data.media.viewUrl;
          if (type === 'image') {
            setImages((prev) => [...prev, uploadedUrl]);
            setFeaturedImage((prev) => prev || uploadedUrl);
          } else if (type === 'video') {
            setVideos((prev) => [...prev, uploadedUrl]);
          } else if (type === 'pdf') {
            setDocuments((prev) => [...prev, uploadedUrl]);
          }
        } else {
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload to Google Drive failed.');
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const removedUrl = images[index];
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (featuredImage === removedUrl) {
      setFeaturedImage(updated[0] || '');
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    setImages((prev) => [...prev, url]);
    if (!featuredImage) setFeaturedImage(url);
    setImageUrlInput('');
  };

  const handleSetMainImage = (url: string) => {
    setFeaturedImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      setErrorMsg('Product piece title and retail price are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        title: title.trim(),
        sku: sku.trim() || undefined,
        category,
        description: description.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        material: material.trim(),
        dimensions: dimensions.trim(),
        stockQuantity: Number(stockQuantity) || 1,
        status,
        showroomLocation: showroomLocation.trim(),
        warrantyDetails: warrantyDetails.trim(),
        featured: featured ? 1 : 0,
        featuredImage: featuredImage || (images.length > 0 ? images[0] : null),
        images: images.length > 0 ? images : [
          category === 'Double Beds'
            ? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
            : category === 'Wardrobes'
            ? 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80'
            : category === 'Center Tables'
            ? 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80'
            : category === 'Room Chairs'
            ? 'https://images.unsplash.com/photo-1580481077195-c22ae4b9868e?auto=format&fit=crop&w=1200&q=80'
            : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
        ],
        videos,
        documents,
      };

      const url = existingProduct ? `/api/products/${existingProduct.id}` : '/api/products';
      const method = existingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to save product catalogue piece.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingProduct ? `Edit Catalogue Piece: ${existingProduct.title}` : 'Add Showroom Furniture Piece'}
      subtitle="Complete product specifications with direct Google Drive 5TB multi-media upload"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-white">
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: CORE PRODUCT DETAILS */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-300 mb-1">Piece Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Royal Emerald 4-Piece Chesterfield Set"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Room Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">SKU / Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Retail Price (PKR) *</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 185000"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Sale / Discount Price (PKR)</label>
              <input
                type="number"
                min={0}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Optional promotional price"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Stock Availability</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="available">Available in Showroom</option>
                <option value="made_to_order">Made to Order (Bespoke)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Material & Wood Finish</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Seasoned Solid Sheesham & Hand-Stitched Leather"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Dimensions & Scale</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 240cm W x 95cm D x 85cm H"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Showroom Display Location</label>
              <input
                type="text"
                value={showroomLocation}
                onChange={(e) => setShowroomLocation(e.target.value)}
                placeholder="e.g. Grand Salon Wing B, Showroom A-1"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Warranty Term</label>
              <input
                type="text"
                value={warrantyDetails}
                onChange={(e) => setWarrantyDetails(e.target.value)}
                placeholder="e.g. 5 Years Architectural Hardwood Warranty"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Detailed Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handcrafted masterwork with precision mortise and tenon joinery..."
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>
        </div>

        {/* SECTION 2: GOOGLE DRIVE 5TB MEDIA UPLOADER */}
        <div className="p-5 bg-black/40 border border-[#B99A68]/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
              <HardDrive className="w-4 h-4" /> Google Drive 5TB Cloud Media Repository
            </div>
            <Badge variant="gold">Auto Folder: SAAD FURNITURE MASTER / Product Catalog / {category}</Badge>
          </div>

          {uploading && (
            <div className="p-3 bg-[#B99A68]/20 border border-[#B99A68]/40 rounded-xl text-white text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#B99A68] animate-spin shrink-0" />
              <span>{uploadProgressText || 'Uploading to Google Drive...'}</span>
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Upload Images */}
            <div>
              <label className="cursor-pointer block p-3 rounded-xl border border-dashed border-[#B99A68]/60 hover:bg-[#B99A68]/10 text-center transition-all">
                <ImageIcon className="w-5 h-5 mx-auto text-[#B99A68] mb-1" />
                <span className="font-bold text-white block">Upload Photographs</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">JPG, PNG, WEBP (Multi)</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Videos */}
            <div>
              <label className="cursor-pointer block p-3 rounded-xl border border-dashed border-[#B99A68]/60 hover:bg-[#B99A68]/10 text-center transition-all">
                <Video className="w-5 h-5 mx-auto text-[#B99A68] mb-1" />
                <span className="font-bold text-white block">Upload Video Tour</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">MP4, WebM High-Definition</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload PDFs */}
            <div>
              <label className="cursor-pointer block p-3 rounded-xl border border-dashed border-[#B99A68]/60 hover:bg-[#B99A68]/10 text-center transition-all">
                <FileText className="w-5 h-5 mx-auto text-[#B99A68] mb-1" />
                <span className="font-bold text-white block">Upload Design PDF</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Specification Sheet / CAD</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Direct Image URL Option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Or paste direct image URL (https://...)..."
              className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImageUrl}
              className="text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Attach URL
            </Button>
          </div>

          {/* Uploaded Images Gallery */}
          {images.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Product Gallery Images ({images.length}) • Click star to select primary showroom display image
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((imgUrl, imgIdx) => {
                  const isMain = featuredImage === imgUrl;
                  return (
                    <div
                      key={imgIdx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group bg-black/40 ${
                        isMain ? 'border-[#B99A68] ring-2 ring-[#B99A68]/30' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={imgUrl} alt={`Product ${imgIdx}`} className="w-full h-full object-cover" />

                      {isMain && (
                        <div className="absolute top-1.5 left-1.5 bg-[#B99A68] text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-1 shadow">
                          <Star className="w-2.5 h-2.5 fill-current" /> Main
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(imgUrl)}
                            className="p-1.5 rounded-lg bg-[#B99A68] text-slate-950 hover:scale-105 transition-transform"
                            title="Set as Main Display Image"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(imgIdx)}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:scale-105 transition-transform"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Uploaded Videos List */}
          {videos.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Product Showcase Videos ({videos.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {videos.map((vUrl, vIdx) => (
                  <div key={vIdx} className="p-2 bg-black/50 border border-white/10 rounded-lg flex items-center gap-2 text-xs">
                    <Video className="w-3.5 h-3.5 text-[#B99A68]" />
                    <span className="text-slate-300 truncate max-w-[200px]">Video #{vIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setVideos(videos.filter((_, idx) => idx !== vIdx))}
                      className="text-red-400 hover:text-red-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded PDF Documents List */}
          {documents.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Attached Design PDFs & Specification Sheets ({documents.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {documents.map((dUrl, dIdx) => (
                  <div key={dIdx} className="p-2 bg-black/50 border border-white/10 rounded-lg flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-[#B99A68]" />
                    <span className="text-slate-300 truncate max-w-[200px]">Document #{dIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setDocuments(documents.filter((_, idx) => idx !== dIdx))}
                      className="text-red-400 hover:text-red-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured Product Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featuredCheck"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 rounded text-[#B99A68] focus:ring-0 bg-slate-900 border-slate-700"
          />
          <label htmlFor="featuredCheck" className="text-xs text-slate-300 cursor-pointer">
            Mark as Featured Luxury Masterpiece (Pinned on Mobile & Desktop Showroom Homepage)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="gold" type="submit" disabled={submitting} className="font-bold px-6">
            {submitting ? 'Saving to Catalog...' : existingProduct ? 'Update Product Piece' : 'Save To Showroom Catalog'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

